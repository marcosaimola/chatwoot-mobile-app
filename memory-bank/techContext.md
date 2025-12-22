# Technical Context - ZapiCRM Mobile App

## Technologies Used

### Core Framework
- **React Native**: 0.77.0 (atualizado em Dez/2024 para suporte 16KB)
- **Expo SDK**: 52.0.48
- **TypeScript**: 5.1.3
- **Node.js**: 24.x (instalado em /usr/local/opt/node@24/bin/node)

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
- **react-native-reanimated**: 3.16.7
- **react-native-gesture-handler**: 2.25.0
- **react-native-screens**: 4.17.0
- **react-native-safe-area-context**: 5.6.2
- **react-native-svg**: 15.15.1
- **react-native-webview**: 13.16.0
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
- **Target SDK**: 35 (Android 15)
- **NDK Version**: 29.0.14206865 (para suporte 16KB page size)
- **Android Gradle Plugin**: 8.5.1 (para suporte 16KB page size)
- **Arquiteturas**: armeabi-v7a, arm64-v8a (ARM apenas, sem x86/x86_64)

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

# Build Android Local (AAB para Google Play)
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="/usr/local/opt/node@24/bin:$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew clean bundleRelease --no-daemon

# Build Android Local (APK para teste)
./gradlew assembleRelease --no-daemon
```

### Android 16KB Page Size (IMPORTANTE)
A partir de Nov/2025, o Google Play exige suporte a 16KB page size.

**Configurações necessárias:**

1. **android/build.gradle**:
   ```gradle
   ndkVersion = "29.0.14206865"
   classpath('com.android.tools.build:gradle:8.5.1')
   ```

2. **android/gradle.properties**:
   ```properties
   reactNativeArchitectures=armeabi-v7a,arm64-v8a
   ```

3. **android/app/build.gradle**:
   ```gradle
   ndk {
       abiFilters 'armeabi-v7a', 'arm64-v8a'
   }
   ```

4. **android/app/Application.mk**:
   ```makefile
   APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true
   APP_LDFLAGS := -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384
   ```

### Android Keystore (Assinatura)
- **Arquivo**: `android/upload-keystore.jks`
- **Alias**: `upload`
- **Senha**: @Upgrybt26
- **SHA1**: CD:78:1B:F0:BF:B1:25:99:3D:1F:44:29:50:EB:5F:66:8E:E6:15:10

**Configuração no build.gradle**:
```gradle
signingConfigs {
    release {
        storeFile file('../upload-keystore.jks')
        storePassword '@Upgrybt26'
        keyAlias 'upload'
        keyPassword '@Upgrybt26'
    }
}
```

### Environment Variables
- `EXPO_PUBLIC_CHATWOOT_BASE_URL`: Backend URL
- `EXPO_PUBLIC_PROJECT_ID`: Expo project ID
- `EXPO_PUBLIC_SENTRY_DSN`: Error tracking
- `EXPO_PUBLIC_IOS_BUNDLE_ID`: iOS bundle identifier
- `EXPO_PUBLIC_ANDROID_PACKAGE`: Android package name

