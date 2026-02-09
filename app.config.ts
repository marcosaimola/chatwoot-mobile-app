import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Extracts host from URL for deep linking configuration
 * @param url - Full URL (e.g., https://atendimento.zapicrm.com.br/)
 * @returns Host string (e.g., atendimento.zapicrm.com.br)
 */
const extractHostFromUrl = (url: string | undefined): string => {
  if (!url) {
    return 'atendimento.zapicrm.com.br'; // Default fallback
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, try to extract host manually
    const cleaned = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return cleaned.split('/')[0] || 'atendimento.zapicrm.com.br';
  }
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // Extract host from environment variable or use default
  const deepLinkHost = extractHostFromUrl(
    process.env.EXPO_PUBLIC_DEEP_LINK_HOST || process.env.EXPO_PUBLIC_INSTALLATION_URL,
  );

  return {
    name: 'ZapiCrm',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'chatwoot-mobile',
    version: '5.5',
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
      buildNumber: '6',
      infoPlist: {
        NSCameraUsageDescription:
          'ZapiCrm uses the camera to allow users to take and send photos or videos in customer conversations or when chatting with the support team.',
        NSPhotoLibraryUsageDescription:
          'ZapiCrm needs access to your photo library to let you choose and send images in customer conversations.',
        NSMicrophoneUsageDescription:
          'ZapiCrm uses the microphone so users can record and send voice messages in customer conversations or when contacting our support team.',
        NSAppleMusicUsageDescription:
          'This app does not use Apple Music, but a system API may require this permission.',
        NSContactsUsageDescription:
          'ZapiCrm precisa acessar seus contatos para importá-los',
        UIBackgroundModes: ['fetch', 'remote-notification', 'audio'],
        ITSAppUsesNonExemptEncryption: false,
      },
      // Arquivos Firebase na raiz do projeto
      googleServicesFile: './GoogleService-Info.plist',
      entitlements: { 'aps-environment': 'production' },
      // Associated domains are optional - React Navigation handles deep links dynamically in runtime
      // If you need App Links verification, set EXPO_PUBLIC_DEEP_LINK_HOST environment variable
      associatedDomains: deepLinkHost ? [`applinks:${deepLinkHost}`] : [],
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
      package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'br.com.zapicrm',
      versionCode: 33,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.READ_CONTACTS',
      ],
      // Arquivos Firebase na raiz do projeto
      googleServicesFile: './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: false, // Disabled to allow dynamic hosts - React Navigation handles deep links in runtime
          data: [
            {
              scheme: 'https',
              // Host from environment variable or default - React Navigation will handle deep links dynamically
              // based on installationUrl in runtime, so this is mainly for Android manifest
              host: deepLinkHost,
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
    owner: 'zapicrm',
    plugins: [
      'expo-font',
      ['react-native-permissions', { iosPermissions: ['Camera', 'PhotoLibrary', 'MediaLibrary', 'Contacts'] }],
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
      '@react-native-firebase/crashlytics',
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
      // FFmpeg for OGG to MP3 conversion on device
      './with-ffmpeg-pod.js',
    ],
    androidNavigationBar: { backgroundColor: '#ffffff' },
  };
};
