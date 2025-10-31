import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: 'ZapiCRM',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'chatwoot-mobile',
    version: '4.4.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    scheme: 'chatwootapp',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      enableFullScreenImage_legacy: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'br.com.zapicrm',
      infoPlist: {
        NSCameraUsageDescription:
          'ZapiCRM uses the camera to allow users to take and send photos or videos in customer conversations or when chatting with the support team.',
        NSPhotoLibraryUsageDescription:
          'ZapiCRM needs access to your photo library to let you choose and send images in customer conversations.',
        NSMicrophoneUsageDescription:
          'ZapiCRM uses the microphone so users can record and send voice messages in customer conversations or when contacting our support team.',
        NSAppleMusicUsageDescription:
          'This app does not use Apple Music, but a system API may require this permission.',
        UIBackgroundModes: ['fetch', 'remote-notification', 'audio'],
        ITSAppUsesNonExemptEncryption: false,
      },
      // Please use the relative path to the google-services.json file
      googleServicesFile: './GoogleService-Info.plist',
      entitlements: { 'aps-environment': 'production' },
      associatedDomains: ['applinks:atendimento.zapicrm.com.br'],
      // Fix dSYM warning
      buildConfiguration: 'Release',
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
      package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'br.com.zapicrm',
      permissions: [
        'android.permission.CAMERA', 
        'android.permission.RECORD_AUDIO',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'
      ],
      // Please use the relative path to the google-services.json file
      googleServicesFile: './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'atendimento.zapicrm.com.br',
              pathPrefix: '/app/accounts/',
              pathPattern: '/*/conversations/*',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'chatwootapp',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        storybookEnabled: process.env.EXPO_STORYBOOK_ENABLED,
      },
    },
    owner: 'chatwoot',
    plugins: [
      'expo-font',
      ['react-native-permissions', { iosPermissions: ['Camera', 'PhotoLibrary', 'MediaLibrary'] }],
      // Temporarily disabled Sentry to fix TestFlight crash
      // [
      //   '@sentry/react-native/expo',
      //   {
      //     url: 'https://sentry.io/',
      //     project: process.env.EXPO_PUBLIC_SENTRY_PROJECT_NAME,
      //     organization: process.env.EXPO_PUBLIC_SENTRY_ORG_NAME,
      //   },
      // ],
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          // https://github.com/invertase/notifee/issues/808#issuecomment-2175934609
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            enableProguardInReleaseBuilds: true,
          },
          ios: { useFrameworks: 'static' },
        },
      ],
      // Temporarily disabled FFmpeg due to download issues
      // './with-ffmpeg-pod.js',
    ],
    androidNavigationBar: { backgroundColor: '#ffffff' },
  };
};
