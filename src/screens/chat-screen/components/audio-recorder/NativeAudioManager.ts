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

// Lock screen player info
let currentAudioInfo: {
  title: string;
  artist: string;
  album: string;
} | undefined;

export const startPlayer = async (
  path: string, 
  callback: Callback, 
  audioInfo?: {
    title?: string;
    artist?: string;
    album?: string;
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
    artist: audioInfo?.artist || 'ZapiCRM',
    album: audioInfo?.album || 'Conversa',
  };

  try {
    // Configure audio session for background playback and lock screen controls
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Setup Now Playing Center for iOS
    if (Platform.OS === 'ios') {
      await NowPlayingCenter.setupRemoteCommandCenter();
      
      // Add remote command listeners
      NowPlayingCenter.addRemoteCommandListeners({
        onPlay: () => resumePlayer(),
        onPause: () => pausePlayer(),
        onStop: () => stopPlayer(),
        onSeek: (position: number) => seekTo(position * 1000),
      });
    }

    // Create new sound instance
    const { sound } = await Audio.Sound.createAsync(
      { uri: path },
      { 
        shouldPlay: true,
        isLooping: false,
        volume: 1.0,
        // Enable lock screen controls
        progressUpdateIntervalMillis: 1000,
      }
    );

    currentSound = sound;

    // Set up playback status listener
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        currentPosition = status.positionMillis || 0;
        currentDuration = status.durationMillis || 0;

        // Update lock screen info
        if (Platform.OS === 'ios') {
          updateLockScreenInfo(status);
        }

        if (status.didJustFinish) {
          // Audio finished playing
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
    currentCallback({ status: AudioStatus.PAUSED });
  }
};

export const resumePlayer = async () => {
  if (currentSound) {
    await currentSound.playAsync();
    currentCallback({ status: AudioStatus.RESUMED });
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
  
  currentCallback({ status: AudioStatus.STOPPED });
};

// Update lock screen info for iOS
const updateLockScreenInfo = async (status: any) => {
  if (Platform.OS === 'ios' && currentAudioInfo) {
    await NowPlayingCenter.setNowPlayingInfo({
      title: currentAudioInfo.title,
      artist: currentAudioInfo.artist,
      album: currentAudioInfo.album,
      duration: Math.round(currentDuration / 1000),
      position: Math.round(currentPosition / 1000),
      playbackRate: status.isPlaying ? 1.0 : 0.0,
    });
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
