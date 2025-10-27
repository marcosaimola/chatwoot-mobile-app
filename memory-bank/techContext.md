# Technical Context - ZapiCRM Mobile App

## Technologies Used

### Core Framework
- **React Native**: 0.76.9
- **Expo SDK**: 52.0.47
- **TypeScript**: 5.1.3
- **Node.js**: Latest LTS

### State Management
- **Redux Toolkit**: 2.5.1
- **Redux Persist**: 6.0.0
- **React Redux**: 9.2.0

### Audio & Media
- **react-native-audio-recorder-player**: 3.6.11
- **expo-av**: 15.0.2
- **react-native-image-picker**: 7.1.2

### Navigation & UI
- **React Navigation**: 6.x
- **react-native-reanimated**: 3.15.5
- **react-native-gesture-handler**: 2.20.2
- **tailwind-react-native-classnames**: For styling

### Backend Integration
- **Firebase**: 21.7.1
- **Axios**: 1.6.4
- **@react-native-firebase/app**: 21.7.1
- **@react-native-firebase/messaging**: 21.7.1

### Development Tools
- **Expo CLI**: Latest
- **Metro**: Bundler
- **Babel**: Transpiler
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Development Setup

### Prerequisites
```bash
# Required installations
npm install -g expo-cli
npm install -g pnpm
```

### Environment Setup
```bash
# Clone and setup
git clone <repository>
cd chatwoot-mobile-app
pnpm install
cp .env.example .env
```

### iOS Development
```bash
# Generate native code
npx expo prebuild --platform ios

# Install pods
cd ios && pod install

# Run on device
pnpm run:ios
```

### Android Development
```bash
# Generate native code
npx expo prebuild --platform android

# Run on device
pnpm run:android
```

## Technical Constraints

### iOS Specific
- **Audio Formats**: OGG not natively supported, requires MP3 conversion
- **Background Audio**: Requires specific AV configuration
- **Push Notifications**: Firebase integration required
- **Bundle Size**: Hermes engine for optimization

### Android Specific
- **Permissions**: Camera, microphone, storage access
- **Background Services**: Foreground service for audio playback
- **Target SDK**: 35 (Android 14)

### Cross-Platform
- **Expo Managed Workflow**: Some native modules require custom development
- **Performance**: Reanimated for smooth animations
- **Memory**: Proper cleanup of audio resources

## Dependencies Management

### Package Manager
- **pnpm**: Primary package manager
- **npm**: Fallback for global packages

### Native Dependencies
- **CocoaPods**: iOS native dependencies
- **Gradle**: Android native dependencies

### Key Configuration Files
- `app.config.ts`: Expo configuration
- `package.json`: JavaScript dependencies
- `ios/Podfile`: iOS native dependencies
- `android/build.gradle`: Android configuration

## Build & Deployment

### Development Builds
```bash
# Local development
pnpm start

# Device testing
pnpm run:ios
pnpm run:android
```

### Production Builds
```bash
# EAS Build for TestFlight
eas build -p ios --profile production

# EAS Build for Play Store
eas build -p android --profile production
```

### Environment Variables
- `EXPO_PUBLIC_CHATWOOT_BASE_URL`: Backend URL
- `EXPO_PUBLIC_PROJECT_ID`: Expo project ID
- `EXPO_PUBLIC_SENTRY_DSN`: Error tracking
- `EXPO_PUBLIC_IOS_BUNDLE_ID`: iOS bundle identifier
- `EXPO_PUBLIC_ANDROID_PACKAGE`: Android package name

