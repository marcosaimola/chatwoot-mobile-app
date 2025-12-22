# Active Context - ZapiCRM Mobile App

## Current Work Focus
**Status**: ✅ **COMPLETED** - Android 16KB page size + iOS build working

## Recent Major Achievements

### 1. Android 16KB Page Size Support (Dez/2024) ✅
- **Problema**: Google Play rejeitando AAB com erro "não compatível com 16KB"
- **Causa**: React Native 0.76.9 não tinha suporte completo a 16KB
- **Solução**:
  - React Native 0.76.9 → 0.77.0
  - NDK 27 → 29.0.14206865
  - AGP → 8.5.1
  - Arquiteturas: ARM apenas (armeabi-v7a, arm64-v8a)
  - Criado Application.mk com APP_SUPPORT_FLEXIBLE_PAGE_SIZES
- **Versão atual**: 5.2 (versionCode 12)

### 2. iOS Build Success ✅
- Resolved all build errors and dependency conflicts
- App now builds and runs successfully on iOS devices
- TestFlight distribution working correctly

### 3. Audio Playback Implementation ✅
- **Backend Integration**: Backend now provides `dataUrlConverted` (MP3) for OGG files
- **Frontend Implementation**: Uses `attachment.dataUrlConverted || attachment.dataUrl`
- **Background Audio**: Audio continues playing when screen is locked
- **Format Support**: MP3, AAC, and OGG (via conversion) all working

### 3. Key Technical Solutions Implemented

#### Audio Conversion Strategy
```typescript
// ComposedBubble.tsx - Smart audio URL selection
<AudioBubble 
  audioSrc={attachment.dataUrlConverted || attachment.dataUrl} 
  variant={props.variant} 
/>

// TypeScript types updated
export type ImageMetadata = {
  dataUrl: string;
  dataUrlConverted?: string; // MP3 version for audio files
  // ... other properties
};
```

#### Background Audio Configuration
```typescript
// Expo AV configuration for background playback
await Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  // ... other settings
});
```

## Current Status Summary

### ✅ Working Features
- iOS build and deployment
- Android build com suporte 16KB
- Google Play upload funcionando
- Audio playback (all formats)
- Background audio continuity
- Push notifications
- TestFlight distribution
- All core chat functionality

### 🔧 Recent Fixes Applied
1. **FFmpeg Removal**: Removed problematic FFmpeg dependency
2. **Sentry Disabled**: Temporarily disabled to fix TestFlight crashes
3. **Firebase Configuration**: Properly configured for iOS
4. **Bundle URL Fix**: Corrected AppDelegate.mm for production builds
5. **Audio Converter**: Simplified to use backend MP3 conversion
6. **16KB Page Size (Dez/2024)**: React Native 0.77.0 + NDK r29 + ARM only
7. **Android Keystore**: Configurado upload-keystore.jks para assinatura

## Next Steps & Considerations

### Immediate Actions
- **Test Production Build**: Verify all features work in TestFlight
- **Monitor Performance**: Check for any performance issues
- **User Feedback**: Collect feedback on audio playback experience

### Future Enhancements
- **Re-enable Sentry**: Once stable, re-enable error tracking
- **FFmpeg Alternative**: Consider alternative audio processing if needed
- **Performance Optimization**: Monitor and optimize as needed

## Active Decisions & Considerations

### 1. Audio Strategy ✅
**Decision**: Use backend MP3 conversion instead of client-side FFmpeg
**Rationale**: More reliable, better performance, iOS compatibility
**Status**: Implemented and working

### 2. Error Tracking ✅
**Decision**: Temporarily disable Sentry for stability
**Rationale**: Sentry was causing TestFlight crashes
**Status**: Disabled, will re-enable when stable

### 3. Build Configuration ✅
**Decision**: Use Expo managed workflow with custom native code
**Rationale**: Balance between ease of development and native functionality
**Status**: Working well

## Current Development Environment
- **Platform**: macOS with Xcode + Android Studio
- **Device**: iPhone + Android (physical device testing)
- **Build System**: EAS Build + TestFlight + Local Gradle
- **Package Manager**: pnpm / npm
- **Version**: 5.2 (versionCode 12)
- **React Native**: 0.77.0
- **Node.js**: 24.x (/usr/local/opt/node@24/bin/node)

## Key Files Modified
- `app.config.ts`: Expo configuration
- `package.json`: Dependencies management
- `android/build.gradle`: NDK r29 + AGP 8.5.1
- `android/app/build.gradle`: Assinatura + abiFilters + packagingOptions
- `android/gradle.properties`: Arquiteturas ARM
- `android/app/Application.mk`: 16KB page size flags
- `android/upload-keystore.jks`: Keystore de produção
- `src/utils/audioConverter.ios.ts`: Audio conversion logic
- `src/screens/chat-screen/components/message-components/ComposedBubble.tsx`: Audio URL selection
- `src/types/Message.ts`: TypeScript types for audio
- `ios/Chatwoot/AppDelegate.mm`: Bundle URL handling

## Android Build Commands
```bash
# Setup
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="/usr/local/opt/node@24/bin:$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Build AAB (Google Play)
cd android && ./gradlew clean bundleRelease --no-daemon

# Build APK (teste)
cd android && ./gradlew assembleRelease --no-daemon
```

