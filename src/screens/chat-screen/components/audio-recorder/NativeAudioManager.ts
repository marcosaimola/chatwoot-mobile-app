/**
 * Native Audio Manager for Lock Screen Player
 * Uses expo-av with native iOS Now Playing Center integration
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import NowPlayingCenter from '@/services/NowPlayingCenter';

export type Callback = (args: { status: AudioStatus; data?: PlayBackType }) => void;

export type PlayBackType = {
  currentPosition: number;
  duration: number;
};

export enum AudioStatus {
  PLAYING = 'PLAYING',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  STOPPED = 'STOPPED',
}

let currentSound: Audio.Sound | undefined;
let currentPath: string | undefined;
let currentCallback: Callback = () => {};
let currentPosition = 0;
let currentDuration = 0;
let isCurrentlyPlaying = false; // Track playing state for toggle / Now Playing
let lastLockScreenSecond = -1; // Throttle Now Playing updates to 1x/s
let nowPlayingInitialized = false; // Only update Now Playing after first full metadata set

// Lock screen player info
let currentAudioInfo: {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
} | undefined;

export const startPlayer = async (
  path: string, 
  callback: Callback, 
  audioInfo?: {
    title?: string;
    artist?: string;
    album?: string;
    artworkUrl?: string;
  }
) => {
  // Stop current audio if playing different file
  if (currentPath !== path && currentSound) {
    await stopPlayer();
  }

  currentPath = path;
  currentCallback = callback;
  currentAudioInfo = {
    title: audioInfo?.title || 'Mensagem de Áudio',
    artist: audioInfo?.artist || 'AppConecta',
    album: audioInfo?.album || 'Conversa',
    artworkUrl: audioInfo?.artworkUrl,
  };

  try {
    // Configure audio session for background playback and lock screen controls
    // This is CRITICAL for lock screen controls to work
    // interruptionModeIOS: 0 = MixWithOthers, 1 = DoNotMix, 2 = DuckOthers
    // NOTE: DoNotMix (1) is required for Now Playing to work properly
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // DoNotMix - required for Now Playing widget
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: 1, // DoNotMix for Android
    });

    // Create new sound instance - first get status without playing
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: path },
      { 
        shouldPlay: false, // Don't auto-play yet - we need to set Now Playing info first
        isLooping: false,
        volume: 1.0,
        progressUpdateIntervalMillis: 500, // Update more frequently
      }
    );

    currentSound = sound;
    
    // Get the duration and update Now Playing info (with artwork) BEFORE starting playback
    if (Platform.OS === 'ios' && status.isLoaded) {
      // Check and log audio session state after expo-av configured it
      const sessionResult = await NowPlayingCenter.activateAudioSession();
      
      // Setup Now Playing Center AFTER audio session is configured by expo-av
      await NowPlayingCenter.setupRemoteCommandCenter();
      
      // Add remote command listeners
      NowPlayingCenter.addRemoteCommandListeners({
        onPlay: () => {
          resumePlayer();
        },
        onPause: () => {
          pausePlayer();
        },
        onStop: () => {
          stopPlayer();
        },
        onSeek: (position: number) => {
          seekTo(position * 1000);
        },
        onToggle: () => {
          if (isCurrentlyPlaying) {
            pausePlayer();
          } else {
            resumePlayer();
          }
        },
      });
      
      const durationSec = Math.round((status.durationMillis || 0) / 1000);
      
      const artworkUrl = currentAudioInfo?.artworkUrl &&
        currentAudioInfo.artworkUrl.startsWith('http')
          ? currentAudioInfo.artworkUrl
          : undefined;
      
      // Set complete Now Playing info with duration + artwork BEFORE playing (only once)
      await NowPlayingCenter.setNowPlayingInfo({
        title: currentAudioInfo?.title || 'Mensagem de Áudio',
        artist: currentAudioInfo?.artist || 'AppConecta',
        album: currentAudioInfo?.album || 'Conversa',
        duration: durationSec,
        position: 0,
        playbackRate: 1.0,
        ...(artworkUrl && { artworkUrl }),
      });
      nowPlayingInitialized = true;
      lastLockScreenSecond = 0;
    }
    
    // Now start playback
    await sound.playAsync();
    isCurrentlyPlaying = true;

    // Set up playback status listener
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        currentPosition = status.positionMillis || 0;
        currentDuration = status.durationMillis || 0;
        
        // Track playing state for remote toggle command.
        // Não confiar em status.isPlaying logo no início (pode vir falso),
        // preferimos manter nosso estado interno e só mudar quando o áudio realmente terminar.
        if (status.didJustFinish) {
          isCurrentlyPlaying = false;
        } else if (status.isPlaying) {
          isCurrentlyPlaying = true;
        }

        // Update lock screen position during playback (throttled)
        if (Platform.OS === 'ios') {
          updateLockScreenInfo(status);
        }

        if (status.didJustFinish) {
          // Audio finished playing
          isCurrentlyPlaying = false;
          currentCallback({
            status: AudioStatus.STOPPED,
            data: {
              currentPosition: currentDuration,
              duration: currentDuration,
            },
          });
          stopPlayer();
        } else if (status.isPlaying) {
          // Audio is playing
          currentCallback({
            status: AudioStatus.PLAYING,
            data: {
              currentPosition: currentPosition,
              duration: currentDuration,
            },
          });
        } else if (status.positionMillis === 0 && !status.isPlaying) {
          // Audio started
          currentCallback({
            status: AudioStatus.STARTED,
            data: {
              currentPosition: 0,
              duration: currentDuration,
            },
          });
        }
      }
    });

  } catch (error) {
    currentCallback({
      status: AudioStatus.STOPPED,
    });
  }
};

export const pausePlayer = async () => {
  if (currentSound) {
    await currentSound.pauseAsync();
    isCurrentlyPlaying = false;
    currentCallback({ status: AudioStatus.PAUSED });
    
    // Update lock screen to show paused state
    if (Platform.OS === 'ios' && currentAudioInfo) {
      await NowPlayingCenter.setNowPlayingInfo({
        title: currentAudioInfo.title,
        artist: currentAudioInfo.artist,
        album: currentAudioInfo.album,
        duration: Math.round(currentDuration / 1000),
        position: Math.round(currentPosition / 1000),
        playbackRate: 0, // 0 = paused
      });
    }
  }
};

export const resumePlayer = async () => {
  if (currentSound) {
    await currentSound.playAsync();
    isCurrentlyPlaying = true;
    currentCallback({ status: AudioStatus.RESUMED });
    
    // Update lock screen to show playing state
    if (Platform.OS === 'ios' && currentAudioInfo) {
      await NowPlayingCenter.setNowPlayingInfo({
        title: currentAudioInfo.title,
        artist: currentAudioInfo.artist,
        album: currentAudioInfo.album,
        duration: Math.round(currentDuration / 1000),
        position: Math.round(currentPosition / 1000),
        playbackRate: 1, // 1 = playing
      });
    }
  }
};

export const seekTo = async (position: number) => {
  if (currentSound) {
    await currentSound.setPositionAsync(position);
    currentCallback({ status: AudioStatus.PLAYING });
  }
};

export const stopPlayer = async () => {
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = undefined;
  }
  
  // Clear Now Playing Center
  if (Platform.OS === 'ios') {
    await NowPlayingCenter.clearNowPlayingInfo();
    NowPlayingCenter.removeAllListeners();
  }
  
  currentPath = undefined;
  currentPosition = 0;
  currentDuration = 0;
  currentAudioInfo = undefined;
  isCurrentlyPlaying = false;
  lastLockScreenSecond = -1;
  nowPlayingInitialized = false;
  
  currentCallback({ status: AudioStatus.STOPPED });
};

// Update lock screen info for iOS
// Regras:
// - NÃO reenviar artwork aqui para evitar flicker.
// - Apenas atualizar posição e playbackRate, 1x por segundo.
// - Não atualizar antes do primeiro set completo (nowPlayingInitialized).
const updateLockScreenInfo = async (status: any) => {
  if (Platform.OS === 'ios' && currentAudioInfo) {
    if (!nowPlayingInitialized) {
      // Ainda não definimos o metadata completo (com artwork), não atualizar.
      return;
    }

    const currentSecond = Math.floor(currentPosition / 1000);
    if (currentSecond === lastLockScreenSecond) {
      return;
    }
    lastLockScreenSecond = currentSecond;

    const info = {
      title: currentAudioInfo.title,
      artist: currentAudioInfo.artist,
      album: currentAudioInfo.album,
      duration: Math.round(currentDuration / 1000),
      position: currentSecond,
      // Usar nosso estado interno (mais confiável que status.isPlaying no início).
      playbackRate: isCurrentlyPlaying ? 1.0 : 0.0,
    };

    await NowPlayingCenter.setNowPlayingInfo(info);
  }
};

// Get current playback info
export const getCurrentPlaybackInfo = () => ({
  path: currentPath,
  position: currentPosition,
  duration: currentDuration,
  isPlaying: currentSound ? true : false,
  audioInfo: currentAudioInfo,
});
