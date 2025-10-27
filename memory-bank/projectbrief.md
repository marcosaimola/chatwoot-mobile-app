# Project Brief - ZapiCRM Mobile App

## Project Overview
ZapiCRM is a mobile application built on the Chatwoot platform, designed for customer service and communication management. The app allows users to view conversations, send messages, follow up on customer conversations, reply with canned responses, receive real-time notifications, communicate with team members, and assign statuses to conversations.

## Core Requirements
- **Platform**: React Native with Expo
- **Target Platforms**: iOS and Android
- **Main Features**:
  - Conversation viewing and management
  - Real-time messaging
  - Audio message playback (including OGG format from WhatsApp)
  - Push notifications via Firebase
  - Team communication
  - Canned responses
  - Status assignment

## Key Success Criteria
1. ✅ App builds and runs successfully on iOS devices
2. ✅ Audio playback works for all formats (MP3, AAC, OGG)
3. ✅ Background audio playback continues when screen is locked
4. ✅ Push notifications work correctly
5. ✅ App can be distributed via TestFlight
6. ✅ All core chat functionality works as expected

## Current Status
- **iOS Build**: ✅ Working
- **Audio Playback**: ✅ Working (including OGG via backend conversion)
- **TestFlight Distribution**: ✅ Working
- **Background Audio**: ✅ Working
- **Push Notifications**: ✅ Working

## Technical Stack
- React Native 0.76.9
- Expo SDK 52
- TypeScript
- Redux Toolkit for state management
- Firebase for push notifications
- React Native Reanimated for animations
- Tailwind CSS for styling

## Project Structure
- `src/` - Main source code
- `ios/` - iOS native code and configuration
- `android/` - Android native code and configuration
- `assets/` - Static assets (images, fonts)
- `memory-bank/` - Project documentation and context

