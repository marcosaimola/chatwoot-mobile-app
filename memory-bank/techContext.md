# Technical Context - ZapiCRM Mobile App

## Technologies Used

### Core Framework
- **React Native**: 0.77.0 (atualizado em Dez/2024 para suporte 16KB)
- **Expo SDK**: 52.0.48
- **TypeScript**: 5.1.3
- **Node.js**: 18 LTS ou 20 LTS (recomendado via nvm)
  - ⚠️ Node 24 NÃO é suportado oficialmente por React Native/Expo
  - Instalado via nvm: `$HOME/.nvm/versions/node/v18.17.0/bin/node` ou similar

### State Management
- **Redux Toolkit**: 2.5.1
- **Redux Persist**: 6.0.0
- **React Redux**: 9.2.0

### Audio & Media
- **react-native-audio-recorder-player**: 3.6.11
- **expo-av**: 15.0.2
- **ffmpeg-kit-react-native**: 6.0.2 (para conversão OGG→M4A no iOS)
- **react-native-fs**: Para cache de áudios convertidos
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
- **Audio Formats**: OGG/OGA not natively supported, converted to M4A via FFmpeg-Kit
- **FFmpeg-Kit Fork**: Uses chatwoot-ffmpeg-kit-ios-https (original FFmpegKit deprecated)
- **Background Audio**: Requires specific AV configuration + UIBackgroundModes audio
- **Now Playing**: Requires MPNowPlayingInfoCenter + AVAudioSessionCategoryPlayback
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

## FFmpeg Audio Conversion (iOS)

### Overview
iOS não suporta OGG/Opus nativamente. Usamos FFmpeg-Kit para converter client-side.

### FFmpeg-Kit Setup
O FFmpegKit original foi descontinuado. Usamos o fork do Chatwoot:

```ruby
# ios/Podfile
pod 'chatwoot-ffmpeg-kit-ios-https', :podspec => 'https://raw.githubusercontent.com/chatwoot/ffmpeg/master/chatwoot-ffmpeg-kit-ios-https.podspec'
```

**IMPORTANTE**: O podspec do ffmpeg-kit-react-native também precisa ser patcheado:
```ruby
# node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec
# Na subspec 'https', mudar dependency para:
ss.dependency 'chatwoot-ffmpeg-kit-ios-https', "6.0.2"
```

**Patch**: O projeto usa `patches/ffmpeg-kit-react-native+6.0.2.patch` (patch-package). Se `npm install` for rodado com `--ignore-scripts`, o patch não é aplicado e o `pod install` falha com **404** ao baixar `ffmpeg-kit-ios-https` da Arthenica (URL não existe mais). **Workaround**: editar manualmente `node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec` na subspec `https` e trocar `ss.dependency 'ffmpeg-kit-ios-https', "6.0"` por `ss.dependency 'chatwoot-ffmpeg-kit-ios-https', "6.0.2"`.

### Conversion Command
```typescript
// Converte OGG/OGA para M4A (AAC)
const ffmpegCommand = `-i "${inputPath}" -c:a aac_at -b:a 128k -y "${outputPath}"`;
```

**Por que M4A/AAC?**
- Build "https" do FFmpegKit não inclui libmp3lame (MP3)
- iOS tem encoder nativo `aac_at` (AudioToolbox)
- M4A é formato nativo do iOS, excelente compatibilidade

### Cache de Áudios Convertidos
```typescript
// Local: Library/Caches/audio_cache/
// Arquivo: MD5 hash da URL + .m4a
// Limpeza: Logout + startup (arquivos > 7 dias)
```

### Detecção de Arquivos OGG/OGA
```typescript
const isOggFile = (url: string): boolean => {
  const lowercaseUrl = url.toLowerCase();
  return (
    lowercaseUrl.endsWith('.ogg') ||
    lowercaseUrl.endsWith('.oga') ||
    lowercaseUrl.includes('.ogg?') ||
    lowercaseUrl.includes('.oga?')
  );
};
```

## iOS Now Playing (Lock Screen)

### Overview
Para exibir informações do áudio na tela de bloqueio e Control Center, usamos MPNowPlayingInfoCenter.

### Módulo Nativo (NowPlayingManager)

**Arquivos:**
- `ios/AppConecta/NowPlayingManager.h`
- `ios/AppConecta/NowPlayingManager.m`

**Métodos exportados:**
- `setupRemoteCommandCenter`: Configura comandos play/pause/seek
- `setNowPlayingInfo`: Define título, artista, duração, posição, artwork
- `activateAudioSession`: Força categoria Playback (expo-av usa Ambient)
- `clearNowPlayingInfo`: Limpa ao parar áudio

### Audio Session Category

**CRÍTICO**: expo-av configura a sessão como `AVAudioSessionCategoryAmbient`, que não suporta Now Playing.

**Solução**: Forçar `AVAudioSessionCategoryPlayback` no módulo nativo:

```objective-c
if (![session.category isEqualToString:AVAudioSessionCategoryPlayback]) {
    [session setCategory:AVAudioSessionCategoryPlayback
                    mode:AVAudioSessionModeDefault
                 options:AVAudioSessionCategoryOptionDuckOthers
                   error:&error];
}
```

### Interface TypeScript (NowPlayingCenter.ts)

```typescript
interface NowPlayingInfo {
  title?: string;      // Nome do remetente
  artist?: string;     // "AppConecta"
  album?: string;      // "AppConecta"
  duration?: number;   // Duração em segundos
  position?: number;   // Posição atual em segundos
  playbackRate?: number; // 0 = pausado, 1 = tocando
  artworkUrl?: string; // URL do avatar (opcional, http/https only)
}
```

### Integração com expo-av

O fluxo correto é:
1. Configurar audio mode via expo-av
2. Criar som SEM autoplay (`shouldPlay: false`)
3. Ativar audio session via NowPlayingCenter
4. Setup command center via NowPlayingCenter
5. Definir Now Playing info
6. Iniciar reprodução (`sound.playAsync()`)

### Troubleshooting Now Playing

**Não aparece no Control Center:**
1. Verificar se category é `Playback` (não `Ambient`)
2. Testar com áudio longo (30+ segundos)
3. Verificar se áudio está realmente tocando

**Logs de debug:**
```
[NowPlayingManager] Current audio category: AVAudioSessionCategoryPlayback ✅
[NowPlayingManager] Current audio category: AVAudioSessionCategoryAmbient ❌
```

