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

**Store Configuration ([src/store/index.ts](src/store/index.ts)):**
- Redux Persist for offline state persistence
- State versioning and migration handling (currently version 3)
- Middleware for contact listening and presence updates
- Reactotron integration in development
- Global logout action resets all state except settings
- Store access for services via `getStore()` from `@/store/storeAccessor`

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
- Use `useAppDispatch` and `useAppSelector` typed hooks from `@/hooks`
- Create slices with `createSlice` from Redux Toolkit
- Use `createAsyncThunk` for async actions (see [src/store/auth/authActions.ts](src/store/auth/authActions.ts))
- Handle optimistic updates for better UX
- Implement proper loading and error states in `uiFlags` sub-objects
- Global actions like `auth/logout` are handled at the root reducer level
- Export selectors in separate files (e.g., `authSelectors.ts`)
- Use immer-powered mutations in reducers (built into Redux Toolkit)

### API Service Architecture

**APIService ([src/services/APIService.ts](src/services/APIService.ts))** is a singleton class that wraps Axios:
- Automatically injects authentication headers (access-token, uid, client)
- Request/response interceptors for error handling
- Base URL management from Redux state
- Auto-prefixes account ID to URLs: `api/v1/accounts/:accountId/` (except for non-account routes)
- Non-account routes: `profile`, `profile/availability`, `notification_subscriptions`, `profile/set_active_account`
- 401 responses trigger global logout action
- Centralized error toasts and handling
- Methods: `get<T>()`, `post<T, D>()`, `put<T, D>()`, `patch<T, D>()`, `delete<T>()`
- Access via: `APIService.getInstance()` or imported `apiService`

**WebhookService ([src/services/WebhookService.ts](src/services/WebhookService.ts)):**
- Separate service for webhook integrations
- 10 second timeout
- Includes auth headers and conversation ID context
- Methods: `post()`, `put()`, `patch()`, `delete()`

### Navigation Structure

**Main Navigation Flow ([src/navigation/](src/navigation/)):**
- Unauthenticated: `AuthStack` (Login, Forgot Password, Change URL)
- Authenticated: `AppTabs` (Bottom tabs with Inbox, Notifications, Settings, AI Agents)
  - `InboxStack`: Conversations list and chat screens
  - `ConversationStack`: Individual conversation details
  - `SettingsStack`: App settings and preferences
  - `AiAgentsStack`: AI agents management

**Navigation Utilities ([src/utils/navigationUtils.ts](src/utils/navigationUtils.ts)):**
- `navigationRef`: React ref to navigation container
- Helper functions: `navigate()`, `replace()`, `pop()`, `getCurrentRouteName()`
- Used for programmatic navigation outside components

**Deep Linking ([src/navigation/index.tsx](src/navigation/index.tsx)):**
- Conversation URLs: `/app/accounts/:accountId/conversations/:conversationId/:primaryActorId?/:primaryActorType?`
- SSO callback handling for SAML authentication
- Push notification navigation to specific conversations
- Custom scheme: `chatwootapp://`
- Associated domain: `atendimento.zapicrm.com.br`

**Tab Initialization:**
- AppTabs initializes multiple Redux stores on first load
- Loads: inboxes, labels, dashboard apps, assignable agents, teams, canned responses
- Real-time connection via ActionCable established in AppTabs

### Theme System

**Configuration ([src/theme/](src/theme/)):**
- `tailwind.config.ts`: Base theme configuration with Tailwind defaults extended
- `tailwind.ts`: Tailwind instance creation using `twrnc` package
- `colors/light.ts`, `colors/dark.ts`: Theme color definitions (Radix UI colors)
- `colors/blackA.ts`, `colors/whiteA.ts`: Alpha variations for transparency

**Styling Approach:**
```typescript
import { tailwind } from '@/theme';

// Basic usage
<View style={tailwind('bg-blue-500 p-4')} />

// Multiple styles
<View style={tailwind.style('bg-gray-100', 'rounded-lg', 'p-3')} />
```

**Color Categories:**
- UI Colors: gray, mauve, slate
- Nature Colors: sage, olive, sand
- Primary Colors: blue, indigo, violet
- Accent Colors: tomato, red, ruby, crimson
- Special Colors: mint, lime, yellow, amber, green

**Typography:**
- Inter font family with 5 weights: 400, 420, 500, 580, 600
- Optical sizes: 20 and 24
- Font classes: `font-inter-normal-20`, `font-inter-420-20`, `font-inter-medium-24`, `font-inter-580-24`, `font-inter-semibold-20`

**Custom Font Sizes:**
- `text-xs`: 12px
- `text-cxs`: 13px (custom)
- `text-md`: 15px

**Native Component Wrappers ([src/components-next/native-components/](src/components-next/native-components/)):**
- `NView`: Custom View wrapper with theme-aware styling
- `NText`: Custom Text wrapper with typography support

### Path Aliasing

All imports use the `@/` prefix for absolute imports:
```typescript
import { useAppSelector } from '@/hooks';
import { selectUser } from '@/store/auth/authSelectors';
import { Button } from '@/components-next/button';
```

Configure in `tsconfig.json` and `jest.config.js`.

### Project Structure

**Main Source Directories:**
- [src/screens/](src/screens/): Feature-specific screen components (auth, chat, conversations, settings, etc.)
- [src/components-next/](src/components-next/): Next-gen UI component library
  - `button/`: Button components with haptic feedback and animations
  - `common/`: Shared UI components (Avatar, Badge, etc.)
  - `list-components/`: List-specific components
  - `native-components/`: NView, NText wrappers
  - `sheet-components/`: Bottom sheet components
- [src/store/](src/store/): Redux Toolkit slices organized by feature
- [src/services/](src/services/): API services (APIService, WebhookService, aiAgentsService)
- [src/navigation/](src/navigation/): React Navigation configuration
- [src/context/](src/context/): React Context providers for UI state
- [src/hooks/](src/hooks/): Custom React hooks (typed Redux hooks, animations)
- [src/theme/](src/theme/): Tailwind configuration and color palettes
- [src/utils/](src/utils/): Utility functions and helpers
- [src/types/](src/types/): TypeScript type definitions
- [src/i18n/](src/i18n/): Internationalization setup
- [src/constants/](src/constants/): Application constants
- [src/svg-icons/](src/svg-icons/): SVG icon components
- [src/assets/](src/assets/): Static assets (fonts, images)

## Critical Development Patterns

### Component Development
- Use functional components only (no classes)
- File structure: exported component, subcomponents, helpers, static content, types
- Use named exports for components
- Break components into focused, single-responsibility pieces
- Use TypeScript interfaces (not types or enums; use maps instead of enums)
- Use `function` keyword for pure functions
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Avoid unnecessary curly braces in conditionals; use concise syntax
- Components are located in [src/components-next/](src/components-next/) and [src/screens/](src/screens/)

### State Management
- Minimize `useState` and `useEffect` usage
- Prefer Redux for shared state across features
- Use React Context for isolated UI state (see [src/context/](src/context/))
  - `ChatWindowContext`: Chat window UI state
  - `InboxListContext`: Inbox list management
  - `ConversationListContext`: Conversation list state
  - `RefsContext`: Component ref management
- Implement memoization with `useMemo` and `useCallback` appropriately
- **Always clean up timers, intervals, and listeners in effects** (critical for event listeners and animations)

### Safe Area Handling
- Wrap screens with `SafeAreaView` from `react-native-safe-area-context`
- Use `SafeAreaProvider` at app root (already configured)
- Never hardcode safe area margins/padding

### Performance & Animations
- Use `expo-image` for optimized image loading with lazy loading
- Implement `@shopify/flash-list` for long lists (already in use for conversations/messages)
- Use `react-native-reanimated@3` for smooth animations
- Leverage `@gorhom/bottom-sheet` for bottom sheet modals
- Implement proper memoization to avoid unnecessary re-renders
- Be mindful of re-renders in conversation/message lists
- Profile with React DevTools and Reactotron

### Notifications & Audio
- Background audio playback requires `UIBackgroundModes: ['audio']` (already configured in [app.config.ts](app.config.ts))
- Use `@react-native-firebase/messaging` for push notifications
- Use `@notifee/react-native` for local notification management
- Audio recording via `react-native-audio-recorder-player`
- Firebase configuration files: `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

### Custom Hooks
- `useAppDispatch` and `useAppSelector`: Typed Redux hooks from [src/hooks/hooks.ts](src/hooks/hooks.ts)
- `useHeaderAnimation`: Header scroll animations
- `useScaleAnimation`: Scale press animations for buttons
- `useHaptic`: Haptic feedback integration

### Code Quality & Formatting
- ESLint with Expo configuration
- Prettier for consistent code formatting
- Strict TypeScript mode enabled
- Use `npm lint` to check code quality
- Avoid using enums; use maps or string unions instead
- Use `interface` over `type` for object shapes

## Environment Configuration

Required environment variables (see [.env.example](.env.example)):
- `EXPO_PUBLIC_CHATWOOT_BASE_URL`: Chatwoot server URL
- `EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION`: Minimum supported version (currently 3.13.0+)
- `EXPO_PUBLIC_PROJECT_ID`: Expo project ID for EAS
- `EXPO_PUBLIC_IOS_BUNDLE_ID` / `EXPO_PUBLIC_ANDROID_PACKAGE`: App identifiers
- `EXPO_PUBLIC_SENTRY_DSN`: Sentry error tracking (currently disabled)
- `EXPO_STORYBOOK_ENABLED`: Enable/disable Storybook
- Firebase configuration files: `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

## Testing & Documentation

**Jest Configuration ([jest.config.js](jest.config.js)):**
- React Native preset
- Module name mapper for `@/` imports
- Transform ignore patterns for React Native and Redux packages
- Mock data files in slice-specific `specs/` directories (e.g., `src/store/auth/specs/authMockData.ts`)
- 38+ test files covering Redux slices, services, and selectors

**Storybook:**
- Component documentation and visual testing
- Stories located alongside components: `*.stories.tsx`
- Commands: `npm run start:storybook`, `npm run storybook:ios`, `npm run storybook:android`
- Storybook generation: `npm run storybook-generate`

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

### Working with Conversations & Real-Time Features
- Real-time updates via Action Cable WebSocket ([src/utils/actionCable.ts](src/utils/actionCable.ts))
- Connection established in `AppTabs` component
- Message typing indicators via Redux (`conversations.typing` slice)
- Audio messages use `react-native-audio-recorder-player`
- Audio player state in `conversations.audioPlayer` slice
- Local audio cache in `conversations.localRecordedAudioCache` slice
- Presence updates for contact availability via middleware
- Conversation participants tracked in `conversations.participants` slice

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

## Key Architectural Patterns

### Singleton Pattern
- `APIService`: Single HTTP client instance accessed via `getInstance()`
- `WebhookService`: Single webhook handler instance
- Ensures consistent state and configuration across the app

### Entity Normalization
- Conversations and contacts use normalized state (likely with Redux Toolkit's `createEntityAdapter`)
- Improves lookup performance and prevents data duplication

### Middleware Pattern
- Contact listener middleware for real-time presence updates
- Middleware intercepts actions and performs side effects
- Configured in [src/store/index.ts](src/store/index.ts)

### Context for Isolated UI State
- Use React Context when shared values need to be accessed across components but don't belong in Redux
- Example: Cannot use Reanimated's `useSharedValue` inside Redux stores, so Context is used instead
- Keep Context usage minimal and scoped to specific UI features

## Android 15 Compatibility

**Status**: ✅ Implemented (October 2025)

The app has been updated for Android 15 (SDK 35) compatibility:

1. **Edge-to-Edge Display**:
   - Uses `react-native-edge-to-edge` library
   - Enabled in [MainActivity.kt](android/app/src/main/java/com/chatwoot/MainActivity.kt)
   - Existing `SafeAreaView` usage ensures proper insets

2. **16KB Page Size Support**:
   - NDK updated to 27.1.12297006 (from 26.1.10909125)
   - Gradle properties configured for 16KB compatibility
   - Required for Google Play Store after November 2025

3. **Deprecated APIs**:
   - Third-party libraries still use deprecated status bar APIs
   - These are warnings only, functionality works normally
   - Waiting for library updates: `react-native-screens`, `@gorhom/bottom-sheet`, `react-native-keyboard-controller`

See [ANDROID_15_UPDATES.md](ANDROID_15_UPDATES.md) for detailed implementation notes.

## Known Issues & Temporary Fixes

- **Sentry**: Currently disabled to fix TestFlight crashes (commented out in [App.tsx](App.tsx) and [app.config.ts](app.config.ts))
- **FFmpeg**: Temporarily disabled due to download issues (commented in [app.config.ts](app.config.ts))
- **Reanimated Logger**: Temporary fix in [reanimatedConfig.js](reanimatedConfig.js) for bottom sheet warnings

## Additional Resources

- Expo Documentation: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- Redux Toolkit: https://redux-toolkit.js.org/
- Tailwind RN: https://github.com/jaredh159/tailwind-react-native-classnames
