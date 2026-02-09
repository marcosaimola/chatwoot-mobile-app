/**
 * React Native module for iOS Now Playing Center
 * Controls lock screen player display and remote commands
 */

import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';

const { NowPlayingManager } = NativeModules;

if (Platform.OS === 'ios' && !NowPlayingManager) {
  console.error('[NowPlayingCenter] NowPlayingManager module NOT FOUND! Rebuild the iOS app.');
}

// Create event emitter only if the native module exists
const NowPlayingEvents = NowPlayingManager 
  ? new NativeEventEmitter(NowPlayingManager)
  : null;

export interface NowPlayingInfo {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  position?: number;
  playbackRate?: number;
  artworkUrl?: string;
}

interface RemoteCommandCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (position: number) => void;
  onToggle?: () => void;
}

class NowPlayingCenter {
  private subscriptions: EmitterSubscription[] = [];
  private callbacks: RemoteCommandCallbacks = {};

  /**
   * Set up remote command center for lock screen controls
   */
  async setupRemoteCommandCenter(): Promise<boolean> {
    if (!NowPlayingManager || Platform.OS !== 'ios') {
      return false;
    }

    try {
      const result = await NowPlayingManager.setupRemoteCommandCenter();
      return result.success;
    } catch (error) {
      console.warn('Failed to setup remote command center:', error);
      return false;
    }
  }

  /**
   * Update now playing info for lock screen
   */
  async setNowPlayingInfo(info: NowPlayingInfo): Promise<boolean> {
    if (!NowPlayingManager || Platform.OS !== 'ios') {
      return false;
    }

    try {
      // Filter out undefined/null/empty values before sending to native
      const cleanInfo: NowPlayingInfo = {};
      if (info.title) cleanInfo.title = info.title;
      if (info.artist) cleanInfo.artist = info.artist;
      if (info.album) cleanInfo.album = info.album;
      if (typeof info.duration === 'number') cleanInfo.duration = info.duration;
      if (typeof info.position === 'number') cleanInfo.position = info.position;
      if (typeof info.playbackRate === 'number') cleanInfo.playbackRate = info.playbackRate;
      // Only include artworkUrl if it's a valid http URL
      if (info.artworkUrl && info.artworkUrl.startsWith('http')) {
        cleanInfo.artworkUrl = info.artworkUrl;
      }
      
      const result = await NowPlayingManager.setNowPlayingInfo(cleanInfo);
      return result?.success || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Activate audio session for Now Playing (call after expo-av creates sound)
   */
  async activateAudioSession(): Promise<{ success: boolean; category?: string }> {
    if (!NowPlayingManager || Platform.OS !== 'ios') {
      return { success: false };
    }

    try {
      const result = await NowPlayingManager.activateAudioSession();
      return result;
    } catch (error) {
      console.warn('Failed to activate audio session:', error);
      return { success: false };
    }
  }

  /**
   * Clear now playing info
   */
  async clearNowPlayingInfo(): Promise<boolean> {
    if (!NowPlayingManager || Platform.OS !== 'ios') {
      return false;
    }

    try {
      const result = await NowPlayingManager.clearNowPlayingInfo();
      return result.success;
    } catch (error) {
      console.warn('Failed to clear now playing info:', error);
      return false;
    }
  }

  /**
   * Add event listeners for remote commands (lock screen controls)
   */
  addRemoteCommandListeners(callbacks: RemoteCommandCallbacks): void {
    if (!NowPlayingEvents || Platform.OS !== 'ios') {
      return;
    }

    // Remove existing subscriptions
    this.removeAllListeners();

    this.callbacks = callbacks;

    // Add play listener
    const playSub = NowPlayingEvents.addListener('onRemotePlay', () => {
      this.callbacks.onPlay?.();
    });
    this.subscriptions.push(playSub);

    // Add pause listener
    const pauseSub = NowPlayingEvents.addListener('onRemotePause', () => {
      this.callbacks.onPause?.();
    });
    this.subscriptions.push(pauseSub);

    // Add stop listener
    const stopSub = NowPlayingEvents.addListener('onRemoteStop', () => {
      this.callbacks.onStop?.();
    });
    this.subscriptions.push(stopSub);

    // Add seek listener
    const seekSub = NowPlayingEvents.addListener('onRemoteSeek', (event: { position: number }) => {
      this.callbacks.onSeek?.(event.position);
    });
    this.subscriptions.push(seekSub);

    // Add toggle listener (for AirPods, CarPlay, etc.)
    const toggleSub = NowPlayingEvents.addListener('onRemoteToggle', () => {
      this.callbacks.onToggle?.();
    });
    this.subscriptions.push(toggleSub);

  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];
    this.callbacks = {};
  }
}

export default new NowPlayingCenter();
