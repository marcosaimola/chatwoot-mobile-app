import RNFS from 'react-native-fs';
import { Audio } from 'expo-av';
import * as Sentry from '@sentry/react-native';

export const convertOggToWav = async (oggUrl: string): Promise<string | Error> => {
  try {
    // For iOS, OGG is not natively supported
    // The backend should now provide MP3 versions via data_url_converted
    // If we're still getting OGG URLs, it means the backend hasn't been updated yet
    
    return new Error('OGG format not supported on iOS. Backend should provide MP3 via data_url_converted.');
    
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
