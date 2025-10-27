# Product Context - ZapiCRM Mobile App

## Why This Project Exists
ZapiCRM mobile app enables customer service teams to manage conversations and provide support on-the-go. It's essential for teams that need to respond to customers quickly, especially for audio messages from WhatsApp and other platforms.

## Problems It Solves
1. **Audio Format Compatibility**: iOS doesn't natively support OGG format (common in WhatsApp), requiring backend conversion to MP3
2. **Background Audio Playback**: Users need to continue listening to audio messages even when the screen is locked
3. **Real-time Communication**: Teams need instant notifications and message updates
4. **Cross-platform Support**: Unified experience across iOS and Android

## How It Should Work
- **Audio Messages**: Backend converts OGG to MP3, frontend uses `dataUrlConverted` when available
- **Background Playback**: Audio continues playing when screen locks (configured via Expo AV)
- **Push Notifications**: Firebase handles real-time notifications
- **Offline Support**: Messages sync when connection is restored

## User Experience Goals
- **Seamless Audio Playback**: All audio formats work without user intervention
- **Reliable Notifications**: Users never miss important messages
- **Intuitive Interface**: Easy navigation and message management
- **Performance**: Fast loading and smooth animations

## Key User Flows
1. **Receiving Audio Message**: User receives OGG audio → Backend converts to MP3 → Frontend plays MP3
2. **Background Listening**: User starts audio → Locks screen → Audio continues playing
3. **Push Notification**: New message arrives → Firebase sends notification → User taps → App opens to conversation

## Success Metrics
- Audio playback success rate: 100%
- Background audio continuity: 100%
- Push notification delivery: >95%
- App crash rate: <1%

