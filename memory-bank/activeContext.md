# Active Context - AppConecta Mobile App

## Current Work Focus
**Status**: ✅ **DONE** - iOS Now Playing Lock Screen Implementation

## Recent Major Achievements

### 1. Client-Side OGG/Opus Audio Conversion (Jan/2025) ✅
- **Problema**: Backend removerá conversão de áudio OGG→MP3
- **Solução**: Implementação de conversão client-side usando FFmpeg-Kit
- **Detalhes técnicos**:
  - iOS: Conversão OGG/OGA → M4A (AAC) usando `ffmpeg-kit-react-native`
  - Android: Reprodução nativa de OGG (não precisa conversão)
  - Cache local de áudios convertidos em `Library/Caches/audio_cache/`
  - Limpeza automática de cache no logout e ao iniciar o app

### 2. iOS Now Playing Lock Screen (Jan/2025) ✅
- **Objetivo**: Exibir player na tela de bloqueio como WhatsApp
- **Status**: Funcionando (play/pause remoto)
- **Componentes criados**:
  - `NowPlayingManager.m/.h`: Módulo nativo iOS para MPNowPlayingInfoCenter
  - `NowPlayingCenter.ts`: Interface TypeScript para o módulo nativo
- **Problemas resolvidos**:
  - Audio session configurada como `Ambient` ao invés de `Playback`
  - Callbacks remotos eram resetados após o setup, então `pausePlayer` não era chamado
- **Soluções**:
  - Forçar categoria `AVAudioSessionCategoryPlayback` no módulo nativo
  - Ajustar ordem no `NowPlayingCenter.addRemoteCommandListeners` para remover listeners antes de setar callbacks

### 3. Android 16KB Page Size Support (Fev/2026) ✅
- Arquitetura: arm64-v8a apenas
- NDK: 27.1.12297006
- **Patches CMakeLists.txt** via patch-package para:
  - `expo-modules-core` → `libexpo-modules-core.so`
  - `expo-av` → `libexpo-av.so`
  - `react-native-reanimated` → `libreanimated.so`, `libworklets.so`
- Cada patch adiciona: `set(CMAKE_SHARED_LINKER_FLAGS ... -Wl,-z,max-page-size=16384)`
- Libs 4KB excluídas via packagingOptions: `libanimation-decoder-gif.so`, `libavif_android.so`
- GIF animado desabilitado: `expo.gif.enabled=false`

### 4. Firebase Crashlytics (Fev/2026) ✅
- Configurado para monitorar crashes Android
- `firebase-crashlytics-gradle:3.0.3` no build.gradle
- `apply plugin: 'com.google.firebase.crashlytics'` no app/build.gradle

## Key Technical Solutions Implemented

### FFmpeg Client-Side Audio Conversion

#### Arquitetura
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Audio URL      │────▶│  audioConverter  │────▶│  Local M4A      │
│  (.ogg/.oga)    │     │  (FFmpeg-Kit)    │     │  (file://)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Cache Manager   │
                        │  (RNFS)          │
                        └──────────────────┘
```

#### iOS Conversion (audioConverter.ios.ts)
```typescript
// Converte OGG/OGA para M4A usando FFmpeg-Kit
import { FFmpegKit } from 'ffmpeg-kit-react-native';

const ffmpegCommand = `-i "${inputPath}" -c:a aac_at -b:a 128k -y "${outputPath}"`;
const session = await FFmpegKit.execute(ffmpegCommand);
```

#### Android (audioConverter.android.ts)
```typescript
// Android suporta OGG nativamente - apenas retorna a URL original
export const convertOggToMp3 = async (oggUrl: string): Promise<string> => {
  return oggUrl;
};
```

#### FFmpeg-Kit iOS Setup
```ruby
# ios/Podfile - Usando fork do Chatwoot
pod 'chatwoot-ffmpeg-kit-ios-https', :podspec => 'https://raw.githubusercontent.com/chatwoot/ffmpeg/master/chatwoot-ffmpeg-kit-ios-https.podspec'
```

### iOS Now Playing Implementation

#### Módulo Nativo (NowPlayingManager.m)
```objective-c
// Força categoria Playback para Now Playing funcionar
if (![session.category isEqualToString:AVAudioSessionCategoryPlayback]) {
    [session setCategory:AVAudioSessionCategoryPlayback
                    mode:AVAudioSessionModeDefault
                 options:AVAudioSessionCategoryOptionDuckOthers
                   error:&error];
}

// Inicia recebimento de controles remotos
[[UIApplication sharedApplication] beginReceivingRemoteControlEvents];

// Configura MPRemoteCommandCenter
MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
[commandCenter.playCommand setEnabled:YES];
[commandCenter.pauseCommand setEnabled:YES];
// ...
```

#### Interface TypeScript (NowPlayingCenter.ts)
```typescript
class NowPlayingCenter {
  async setupRemoteCommandCenter(): Promise<boolean>;
  async setNowPlayingInfo(info: NowPlayingInfo): Promise<boolean>;
  async activateAudioSession(): Promise<{ success: boolean; category?: string }>;
  async clearNowPlayingInfo(): Promise<boolean>;
  addRemoteCommandListeners(callbacks: RemoteCommandCallbacks): void;
}
```

#### Integração no NativeAudioManager.ts
```typescript
// 1. Configurar audio mode (expo-av)
await Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  interruptionModeIOS: 1, // DoNotMix - required for Now Playing
});

// 2. Criar som sem tocar
const { sound, status } = await Audio.Sound.createAsync(
  { uri: path },
  { shouldPlay: false }
);

// 3. Ativar audio session e forçar categoria Playback
await NowPlayingCenter.activateAudioSession();

// 4. Setup command center
await NowPlayingCenter.setupRemoteCommandCenter();

// 5. Definir Now Playing info
await NowPlayingCenter.setNowPlayingInfo({
  title: senderName,
  artist: 'AppConecta',
  album: 'AppConecta',
  duration: durationSec,
  position: 0,
  playbackRate: 1.0,
  artworkUrl: senderAvatar, // Opcional
});

// 6. Iniciar reprodução
await sound.playAsync();
```

## Current Status Summary

### ✅ Working Features
- iOS build and deployment
- Android build com suporte 16KB
- Google Play upload funcionando
- Audio playback (MP3, AAC, OGG via FFmpeg conversion)
- Background audio continuity
- Push notifications
- TestFlight distribution
- Client-side OGG→M4A conversion (iOS)
- All core chat functionality

### ✅ Completed
- iOS Now Playing lock screen display + play/pause remoto funcional

### 🔧 Recent Fixes Applied
1. **FFmpeg Re-enabled**: Using chatwoot-ffmpeg-kit-ios-https fork
2. **Client-side conversion**: OGG/OGA → M4A usando aac_at encoder
3. **Audio cache**: Implementado em Library/Caches/audio_cache/
4. **Sentry Disabled**: Temporarily disabled to fix TestFlight crashes
5. **16KB Page Size**: Patches CMakeLists.txt via patch-package + packagingOptions excludes
6. **NowPlayingManager**: Módulo nativo iOS para lock screen player
7. **NowPlayingCenter fix**: Corrigida ordem de callbacks em `addRemoteCommandListeners`
8. **Firebase Crashlytics**: Configurado para monitorar crashes Android
9. **Build script melhorado**: Verifica patches, limpa CMake caches, valida 16KB automaticamente

## Active Decisions & Considerations

### 1. Audio Conversion Strategy ✅
**Decision**: Client-side FFmpeg conversion (OGG→M4A)
**Rationale**: Backend removerá conversão, iOS não suporta OGG nativo
**Implementation**:
- iOS: ffmpeg-kit-react-native com aac_at encoder
- Android: Reprodução nativa de OGG
- Cache local para áudios convertidos

### 2. Now Playing Implementation ✅
**Decision**: Módulo nativo iOS para MPNowPlayingInfoCenter
**Challenge**:
- expo-av configura audio session como Ambient
- callbacks remotos eram limpos após serem setados
**Solution**:
- Forçar categoria Playback no módulo nativo
- Ajustar ordem em `NowPlayingCenter.addRemoteCommandListeners`

### 3. FFmpeg Fork
**Decision**: Usar chatwoot-ffmpeg-kit-ios-https
**Rationale**: FFmpegKit original foi descontinuado
**Podspec**: https://raw.githubusercontent.com/chatwoot/ffmpeg/master/chatwoot-ffmpeg-kit-ios-https.podspec

## Key Files Modified

### Audio Conversion
- `src/utils/audioConverter.ios.ts`: Conversão FFmpeg OGG→M4A
- `src/utils/audioConverter.android.ts`: Passthrough (Android suporta OGG)
- `src/utils/cacheManager.ts`: Gerenciamento de cache de áudio
- `ios/Podfile`: Pod do chatwoot-ffmpeg-kit-ios-https

### Now Playing (iOS Lock Screen)
- `native-modules/ios-native/NowPlayingManager.h`: Backup do header (versionado no git)
- `native-modules/ios-native/NowPlayingManager.m`: Backup da implementação (versionado no git)
- `ios/AppConecta/NowPlayingManager.h`: Header do módulo nativo (gerado)
- `ios/AppConecta/NowPlayingManager.m`: Implementação do módulo nativo (gerado)
- `src/services/NowPlayingCenter.ts`: Interface TypeScript
- `src/screens/chat-screen/components/audio-recorder/NativeAudioManager.ts`: Integração
- `scripts/install-native-modules.sh`: Script para restaurar módulos após regeneração

### Audio Playback
- `src/screens/chat-screen/components/message-components/AudioBubble.tsx`: Player de áudio
- `src/screens/chat-screen/components/message-components/ComposedBubble.tsx`: Detecta OGG e passa metadata

### Configuration
- `app.config.ts`: FFmpeg plugin + UIBackgroundModes audio
- `package.json`: ffmpeg-kit-react-native dependency
- `ios/AppConecta.xcodeproj/project.pbxproj`: NowPlayingManager files

## Android Build Commands

### Método Automatizado (Recomendado)
```bash
./build-aab-with-android-studio-java.sh
# ou
npm run build:android:aab
```

### Método Manual
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
cd android && ./gradlew clean bundleRelease --no-daemon
```

## iOS Build Commands

### Clean Build
```bash
cd ios
rm -rf build/ Pods/
rm -rf ~/Library/Developer/Xcode/DerivedData/AppConecta-*
export LANG=en_US.UTF-8
pod install
open AppConecta.xcworkspace
# Xcode: Cmd+Shift+K (clean), Cmd+B (build), Cmd+R (run)
```

## Troubleshooting

### FFmpeg não encontrado
- Verificar se `with-ffmpeg-pod.js` está habilitado em app.config.ts
- Rodar `pod install` novamente

### pod install 404 ao instalar ffmpeg-kit-ios-https
- **Causa**: O patch do ffmpeg-kit-react-native não foi aplicado (ex.: `npm install --ignore-scripts`). O podspec em node_modules ainda aponta para o ffmpeg da Arthenica (URL 404).
- **Solução**: Em `node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec`, na subspec `https`, trocar `ss.dependency 'ffmpeg-kit-ios-https', "6.0"` por `ss.dependency 'chatwoot-ffmpeg-kit-ios-https', "6.0.2"`. Depois rodar `pod install` de novo.

### Now Playing não aparece
- Verificar se audio category é `AVAudioSessionCategoryPlayback` (não Ambient)
- Testar com áudio mais longo (30+ segundos)
- Verificar Control Center enquanto áudio toca
- **IMPORTANTE**: Verificar se os arquivos `NowPlayingManager.h/.m` existem em `ios/AppConecta/`

### Módulos Nativos Perdidos após `npm run generate`

A pasta `ios/` é regenerada do zero e módulos nativos customizados são perdidos.

**Solução**: Restaurar os módulos do diretório `native-modules/`:

```bash
# Opção 1: Script automatizado
./scripts/install-native-modules.sh

# Opção 2: Manual
cp native-modules/ios-native/NowPlayingManager.h ios/AppConecta/
cp native-modules/ios-native/NowPlayingManager.m ios/AppConecta/
```

Depois, adicionar ao Xcode:
1. Abra `ios/AppConecta.xcworkspace`
2. Arraste os arquivos para o grupo `AppConecta`
3. Clean Build (Cmd+Shift+K) e Build (Cmd+B)

### pod install encoding error
```bash
export LANG=en_US.UTF-8
pod install
```
