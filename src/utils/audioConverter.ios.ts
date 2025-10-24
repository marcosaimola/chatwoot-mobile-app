import RNFS from 'react-native-fs';
import { Audio } from 'expo-av';
import * as Sentry from '@sentry/react-native';

export const convertOggToWav = async (oggUrl: string): Promise<string | Error> => {
  try {
    // For iOS, download the file and return the local path
    // This ensures the audio player can access the file
    const fileName = `audio_${Date.now()}.ogg`;
    const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    
    const downloadResult = await RNFS.downloadFile({
      fromUrl: oggUrl,
      toFile: localPath,
    }).promise;
    
    if (downloadResult.statusCode === 200) {
      // Verify the file exists
      const fileExists = await RNFS.exists(localPath);
      if (fileExists) {
        return localPath;
      } else {
        throw new Error('Downloaded file not found');
      }
    } else {
      throw new Error(`Download failed with status ${downloadResult.statusCode}`);
    }
  } catch (error) {
    Sentry.captureException(error);
    return error as Error;
  }
};

export const convertAacToWav = async (inputPath: string): Promise<string> => {
  try {
    // For iOS, return the original path as-is
    // iOS can play AAC files natively
    return inputPath;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};

// New function to play audio using Expo AV
export const playAudioWithExpoAV = async (audioPath: string): Promise<void> => {
  try {
    // Configure audio session for background playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: audioPath.startsWith('file://') ? audioPath : `file://${audioPath}` },
      { shouldPlay: true }
    );
    
    // Clean up after playback
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};
