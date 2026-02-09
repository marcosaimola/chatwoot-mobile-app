import RNFS from 'react-native-fs';
// import * as Sentry from '@sentry/react-native'; // Sentry disabled

const CACHE_DIR = RNFS.CachesDirectoryPath;
const AUDIO_CACHE_PREFIX = 'audio_converted_';

/**
 * On Android, OGG/Opus is natively supported, so no conversion needed.
 * Just return the original URL.
 * 
 * @param oggUrl - URL of the OGG file
 * @returns The original URL (Android can play OGG directly)
 */
export const convertOggToWav = async (oggUrl: string): Promise<string | Error> => {
  // Android supports OGG/Opus natively, no conversion needed
  return oggUrl;
};

/**
 * Alias for consistency
 */
export const convertOggToMp3 = convertOggToWav;

/**
 * For AAC files, Android can play them natively - no conversion needed
 */
export const convertAacToWav = async (inputPath: string): Promise<string> => {
  return inputPath;
};

/**
 * Clears the audio conversion cache
 * @param maxAgeDays - Maximum age of cached files in days (default: 7)
 */
export const clearAudioCache = async (maxAgeDays: number = 7): Promise<void> => {
  try {
    const files = await RNFS.readDir(CACHE_DIR);
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      if (file.name.startsWith(AUDIO_CACHE_PREFIX)) {
        const fileAge = now - new Date(file.mtime || 0).getTime();
        if (fileAge > maxAge) {
          await RNFS.unlink(file.path);
        }
      }
    }
  } catch (error) {
    // Sentry.captureException(error);
  }
};

/**
 * Gets the total size of the audio cache in bytes
 */
export const getAudioCacheSize = async (): Promise<number> => {
  try {
    const files = await RNFS.readDir(CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      if (file.name.startsWith(AUDIO_CACHE_PREFIX)) {
        totalSize += file.size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    // Sentry.captureException(error);
    return 0;
  }
};
