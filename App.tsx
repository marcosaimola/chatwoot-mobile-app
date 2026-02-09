import Constants from 'expo-constants';
import App from './src/app';
import crashlyticsService from './src/services/CrashlyticsService';

// TODO: It is a temporary fix to fix the reanimated logger issue
// Ref: https://github.com/gorhom/react-native-bottom-sheet/issues/1983
// https://github.com/dohooo/react-native-reanimated-carousel/issues/706
import './reanimatedConfig';
// import './wdyr';

const isStorybookEnabled = Constants.expoConfig?.extra?.eas?.storybookEnabled;

// Initialize Firebase Crashlytics for error tracking and crash reporting
// Replaces Sentry which was causing TestFlight crashes
if (!__DEV__) {
  crashlyticsService.initialize().catch((error) => {
    console.error('Failed to initialize Crashlytics:', error);
  });
} else {
  // In development, initialize but with logging
  crashlyticsService.initialize();
}

if (__DEV__) {
  // eslint-disable-next-line
  require('./ReactotronConfig');
}
// Ref: https://dev.to/dannyhw/how-to-swap-between-react-native-storybook-and-your-app-p3o
export default (() => {
  if (isStorybookEnabled === 'true') {
    // eslint-disable-next-line
    return require('./.storybook').default;
  }

  console.log('Loading App');
  return App;
})();
