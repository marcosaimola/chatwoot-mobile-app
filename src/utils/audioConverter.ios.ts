import RNFS from 'react-native-fs';
// import * as Sentry from '@sentry/react-native'; // Sentry disabled
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

const CACHE_DIR = RNFS.CachesDirectoryPath;
const AUDIO_CACHE_PREFIX = 'audio_converted_';

/**
 * Generates a simple hash from a URL string for caching purposes
 */
const generateHash = (url: string): string => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Converts OGG audio file to MP3 format using FFmpeg
 * Downloads the OGG file, converts it locally, and caches the result
 * 
 * @param oggUrl - URL of the OGG file to convert
 * @returns Path to the converted MP3 file, or Error if conversion fails
 */
export const convertOggToWav = async (oggUrl: string): Promise<string | Error> => {
  try {
    // Generate cache filename from URL hash
    const hash = generateHash(oggUrl);
    const cachedPath = `${CACHE_DIR}/${AUDIO_CACHE_PREFIX}${hash}.m4a`;
    
    // Check if already cached
    const exists = await RNFS.exists(cachedPath);
    if (exists) {
      return `file://${cachedPath}`;
    }
    
    // Download OGG file to temp location
    const tempOggPath = `${CACHE_DIR}/temp_${hash}.ogg`;
    
    const downloadResult = await RNFS.downloadFile({
      fromUrl: oggUrl,
      toFile: tempOggPath,
    }).promise;
    
    if (downloadResult.statusCode !== 200) {
      throw new Error(`Failed to download OGG file: HTTP ${downloadResult.statusCode}`);
    }
    
    // Convert with FFmpeg using AAC encoder via AudioToolbox
    const ffmpegCommand = `-i "${tempOggPath}" -c:a aac_at -b:a 128k -y "${cachedPath}"`;
    
    const session = await FFmpegKit.execute(ffmpegCommand);
    const returnCode = await session.getReturnCode();
    
    // Cleanup temp file
    try {
      await RNFS.unlink(tempOggPath);
    } catch {
      // Ignore cleanup errors
    }
    
    if (ReturnCode.isSuccess(returnCode)) {
      return `file://${cachedPath}`;
    }
    
    // Get error logs for debugging
    const logs = await session.getAllLogsAsString();
    // Sentry.captureMessage(`FFmpeg conversion failed: ${logs}`, 'error');
    
    return new Error('FFmpeg conversion failed');
    
  } catch (error) {
    // Sentry.captureException(error);
    return error as Error;
  }
};

/**
 * Converts OGG URL to MP3 (alias for consistency)
 */
export const convertOggToMp3 = convertOggToWav;

/**
 * For AAC files, iOS can play them natively - no conversion needed
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
