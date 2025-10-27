# System Patterns - ZapiCRM Mobile App

## Architecture Overview
The app follows a React Native + Expo architecture with Redux for state management and Firebase for backend services.

## Key Technical Decisions

### 1. Audio Handling Strategy
```typescript
// Backend provides both original and converted formats
const audioUrl = attachment.dataUrlConverted || attachment.dataUrl;

// Frontend uses MP3 when available, falls back to original
<AudioBubble audioSrc={audioUrl} variant={props.variant} />
```

### 2. Background Audio Configuration
```typescript
// Expo AV configuration for background playback
await Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});
```

### 3. State Management Pattern
- Redux Toolkit with slices for each feature
- Redux Persist for state persistence
- Typed selectors and actions
- Middleware for side effects

### 4. Navigation Structure
- React Navigation with stack and tab navigators
- Deep linking support
- Screen-specific navigation patterns

## Component Relationships

### Audio Playback Flow
```
ComposedBubble → AudioBubble → AudioBubblePlayer → AudioManager → react-native-audio-recorder-player
```

### State Flow
```
Redux Store → Selectors → Components → Actions → Reducers → Store Update
```

### Firebase Integration
```
Firebase Config → App Initialization → Push Notifications → Background Handling
```

## Design Patterns in Use

### 1. Fallback Pattern
- Audio: MP3 → OGG → Error message
- Network: Online → Offline → Sync when restored
- Images: High-res → Low-res → Placeholder

### 2. Error Boundary Pattern
- Sentry integration for error tracking
- Graceful degradation for unsupported features
- User-friendly error messages

### 3. Lazy Loading Pattern
- Components loaded on demand
- Images loaded progressively
- Messages loaded in batches

## Key Dependencies
- **Audio**: `react-native-audio-recorder-player`, `expo-av`
- **State**: `@reduxjs/toolkit`, `redux-persist`
- **Navigation**: `@react-navigation/native`
- **Notifications**: `@react-native-firebase/messaging`
- **Animations**: `react-native-reanimated`
- **Styling**: `tailwind-react-native-classnames`

