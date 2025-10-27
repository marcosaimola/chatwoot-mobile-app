# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chatwoot Mobile is a React Native mobile application for the Chatwoot customer support platform, built with Expo and TypeScript. The app enables support agents to manage customer conversations, send messages, use canned responses, receive notifications, and collaborate with team members on the go.

**Supported Versions:**
- Chatwoot: 3.13.0+
- iOS: 13.4+
- Android: 6.0+
- React Native: 0.76.9
- Expo: ~52.0

## Essential Commands

### Development
```bash
# Start development server
npm start

# Run on iOS simulator (with device selection)
npm run run:ios

# Run on Android emulator (with device selection)
npm run run:android

# Clean cache and dependencies
npm run clean

# Check Expo configuration
npm run run:doctor
npm run check:config

# Generate native projects (full clean)
npm run generate

# Generate native projects (soft)
npm run generate:soft
```

### Testing & Quality
```bash
# Run tests
npm test

# Lint code
npm lint
```

### Building & Deployment
```bash
# Build locally for testing
npm run build:ios:local
npm run build:android:local
npm run build:all:local

# Build with EAS (requires configuration)
npm run build:ios
npm run build:android
npm run build:all

# Submit to stores
npm run submit:ios
npm run submit:android
npm run submit:all

# Build and submit in one command (local)
npm run build-and-submit:ios:local
npm run build-and-submit:android:local
```

### Storybook
```bash
# Start Storybook
npm run start:storybook

# Generate Storybook stories
npm run storybook-generate

# Run Storybook on iOS
npm run storybook:ios

# Run Storybook on Android
npm run storybook:android
```

### Android Development
```bash
# Connect ADB reverse proxy for development
npm run adb:connect
```

## Architecture Overview

### Technology Stack
- **Framework:** React Native with Expo managed workflow
- **Language:** TypeScript (strict mode enabled)
- **State Management:** Redux Toolkit with Redux Persist
- **Navigation:** React Navigation (native stack and bottom tabs)
- **Styling:** Tailwind CSS via `twrnc` package
- **Animations:** React Native Reanimated v3
- **Backend Communication:** Axios with Action Cable for WebSocket
- **Push Notifications:** Firebase Cloud Messaging + Notifee
- **Testing:** Jest
- **Debugging:** Reactotron (dev only)

### State Management Architecture

The app uses Redux Toolkit with a sophisticated setup:

**Store Configuration:**
- Redux Persist for offline state persistence
- State versioning and migration handling (currently version 3)
- Middleware for contact listening and presence updates
- Reactotron integration in development
- Global logout action resets all state except settings

**State Structure:**
```typescript
RootState {
  auth: AuthState
  settings: SettingsState
  conversations: {
    filter, selected, header, list, actions, typing,
    sendMessage, audioPlayer, localRecordedAudioCache, participants
  }
  contacts: { list, labels, conversations }
  labels, inboxes, assignableAgents
  notifications: { list, filter }
  teams, macros, dashboardApps
  customAttributes, cannedResponses
}
```

**Important Redux Patterns:**
- Use `useAppSelector` and `useAppDispatch` typed hooks from `@/hooks`
- Create slices with `createSlice` from Redux Toolkit
- Handle optimistic updates for better UX
- Implement proper loading and error states
- Global actions like `auth/logout` are handled at the root reducer level

### API Service Architecture

`APIService` is a singleton class that wraps Axios:
- Automatically injects authentication headers (access-token, uid, client)
- Request/response interceptors for error handling
- Base URL management from Redux state
- Account-scoped endpoints (except profile, availability, notifications)
- Centralized error toasts and handling

### Navigation Structure

**Main Navigation Flow:**
- Unauthenticated: `AuthStack` (Login, Forgot Password, Change URL)
- Authenticated: `AppTabs` (Bottom tabs with Inbox, Notifications, Settings)
  - `InboxStack`: Conversations list and chat screens
  - `ConversationStack`: Individual conversation details
  - `SettingsStack`: App settings and preferences

**Deep Linking:**
- Supports conversation URLs: `/app/accounts/:accountId/conversations/:conversationId`
- SSO callback handling for SAML authentication
- Push notification navigation to specific conversations
- Custom scheme: `chatwootapp://`

### Theme System

**Styling Approach:**
- Import `tailwind` from `@/theme/tailwind`
- Use Tailwind classes via `tailwind('class-name')` utility
- Custom color palette defined in `theme/colors/`
- Supports both light and dark modes

**Typography:**
- Inter font family with 5 weights: 400, 420, 500, 580, 600
- Optical sizes: 20 and 24
- Font classes: `font-inter-normal-20`, `font-inter-medium-24`, etc.

**Custom Font Sizes:**
- `text-xs`: 12px
- `text-cxs`: 13px (custom)
- `text-md`: 15px

### Path Aliasing

All imports use the `@/` prefix for absolute imports:
```typescript
import { useAppSelector } from '@/hooks';
import { selectUser } from '@/store/auth/authSelectors';
import { Button } from '@/components-next/button';
```

Configure in `tsconfig.json` and `jest.config.js`.

## Critical Development Patterns

### Component Development
- Use functional components only (no classes)
- Structure: exported component, subcomponents, helpers, static content, types
- Named exports for components
- Break components into focused, single-responsibility pieces
- Use TypeScript interfaces (not types/enums)
- Use `function` keyword for pure functions

### State Management
- Minimize `useState` and `useEffect` usage
- Prefer Redux for shared state
- Use React Context only for truly global UI state
- Implement memoization with `useMemo` and `useCallback` appropriately
- Always clean up timers, intervals, and listeners in effects

### Safe Area Handling
- Wrap screens with `SafeAreaView` from `react-native-safe-area-context`
- Use `SafeAreaProvider` at app root (already configured)
- Never hardcode safe area margins/padding

### Performance
- Use `expo-image` for optimized image loading
- Implement `@shopify/flash-list` for long lists (already in use)
- Profile with React DevTools and Flipper
- Be mindful of re-renders in conversation/message lists

### Notifications & Audio
- Background audio playback requires `UIBackgroundModes: ['audio']` (already configured)
- Use `@react-native-firebase/messaging` for push notifications
- Use `@notifee/react-native` for local notification management
- Audio recording via `react-native-audio-recorder-player`

## Environment Configuration

Required environment variables (see `.env.example`):
- `EXPO_PUBLIC_CHATWOOT_BASE_URL`: Chatwoot server URL
- `EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION`: Minimum supported version
- `EXPO_PUBLIC_PROJECT_ID`: Expo project ID for EAS
- `EXPO_PUBLIC_IOS_BUNDLE_ID` / `EXPO_PUBLIC_ANDROID_PACKAGE`: App identifiers
- Firebase configuration files: `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

## Testing

- Jest is configured with React Native preset
- Module name mapper for `@/` imports
- Transform ignore patterns for React Native packages
- Mock files in `__mocks__/` directory

## Common Workflows

### Adding a New Screen
1. Create screen component in `src/screens/<feature>/`
2. Add route to appropriate stack navigator
3. Update navigation types if using TypeScript navigation
4. Add to deep linking config if accessible via URL

### Creating a New Redux Slice
1. Create slice in `src/store/<feature>/`
2. Define state interface and initial state
3. Create reducers and actions with `createSlice`
4. Export selectors in separate file
5. Add to `src/store/reducers.ts`
6. Update `RootState` type if needed

### Adding a New API Endpoint
1. Use `APIService.getInstance()` singleton
2. Call methods: `get()`, `post()`, `put()`, `patch()`, `delete()`
3. Handle authentication automatically via interceptors
4. Implement proper error handling with try-catch
5. Consider adding loading states to Redux

### Working with Conversations
- Conversations use Action Cable for real-time updates
- WebSocket service in `src/services/WebhookService.ts`
- Message typing indicators via Redux (`conversations.typing` slice)
- Audio messages use custom recorder and player components
- Presence updates for contact availability

## Platform-Specific Notes

### iOS
- Uses static frameworks (`useFrameworks: 'static'`)
- Requires signing configuration in EAS
- Background audio playback enabled
- Associated domains configured for deep linking

### Android
- Min SDK: 24, Target SDK: 35
- ProGuard enabled for release builds
- Intent filters for deep linking and custom scheme
- Foreground service permission for audio playback

## Known Issues & Temporary Fixes

- **Sentry**: Currently disabled to fix TestFlight crashes (commented out in `App.tsx` and `app.config.ts`)
- **FFmpeg**: Temporarily disabled due to download issues (commented in `app.config.ts`)
- **Reanimated Logger**: Temporary fix in `reanimatedConfig.js` for bottom sheet warnings

## Additional Resources

- Expo Documentation: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- Redux Toolkit: https://redux-toolkit.js.org/
- Tailwind RN: https://github.com/jaredh159/tailwind-react-native-classnames
