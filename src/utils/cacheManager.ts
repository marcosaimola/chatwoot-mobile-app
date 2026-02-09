/**
 * Cache Manager for audio and other cached files
 * Provides centralized cache management across the app
 */
import { Platform } from 'react-native';
// import * as Sentry from '@sentry/react-native'; // Sentry disabled

// Platform-specific imports for audio converter
// eslint-disable-next-line import/no-unresolved
import { clearAudioCache, getAudioCacheSize } from '@/utils/audioConverter';

/**
 * Clears all app caches including audio conversion cache
 * Should be called on logout to free up storage
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    // Clear audio conversion cache (all files, no age limit)
    await clearAudioCache(0);
  } catch (error) {
    // Sentry.captureException(error); // Sentry disabled
    console.error('Error clearing caches:', error);
  }
};

/**
 * Clears expired cache files based on age
 * @param maxAgeDays - Maximum age of cached files in days (default: 7)
 */
export const clearExpiredCaches = async (maxAgeDays: number = 7): Promise<void> => {
  try {
    await clearAudioCache(maxAgeDays);
  } catch (error) {
    // Sentry.captureException(error); // Sentry disabled
    console.error('Error clearing expired caches:', error);
  }
};

/**
 * Gets the total size of all caches in bytes
 */
export const getTotalCacheSize = async (): Promise<number> => {
  try {
    const audioSize = await getAudioCacheSize();
    return audioSize;
  } catch (error) {
    // Sentry.captureException(error); // Sentry disabled
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Formats bytes to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
