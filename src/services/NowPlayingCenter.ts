/**
 * React Native module for iOS Now Playing Center
 * Uses Expo Modules for better compatibility
 */

import { NativeModules, Platform } from 'react-native';

const { NowPlayingManager } = NativeModules;

export interface NowPlayingInfo {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  position?: number;
  playbackRate?: number;
  artworkUrl?: string;
}

class NowPlayingCenter {
  constructor() {
    // Expo modules don't need event emitter setup
  }

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
      const result = await NowPlayingManager.setNowPlayingInfo(info);
      return result.success;
    } catch (error) {
      return false;
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
      return false;
    }
  }

  /**
   * Add event listeners for remote commands
   * Note: For Expo modules, we'll handle this differently
   */
  addRemoteCommandListeners(callbacks: {
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onSeek?: (position: number) => void;
  }) {
    // For now, we'll implement basic functionality without event listeners
    // The remote commands will work through the native module
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    // No-op for Expo modules
  }
}

export default new NowPlayingCenter();
