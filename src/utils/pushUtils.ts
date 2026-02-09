import { NOTIFICATION_TYPES } from '@/constants';
import { Notification } from '@/types/Notification';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifee = require('@notifee/react-native')
  .default as typeof import('@notifee/react-native').default;

export const clearAllDeliveredNotifications = async () => {
  try {
    const currentBadge = await notifee.getBadgeCount();
    console.log('[Badge] clearAllDeliveredNotifications called, current badge:', currentBadge);
    await notifee.cancelAllNotifications();
    console.log('[Badge] cancelAllNotifications done');
    await notifee.setBadgeCount(0);
    const afterBadge = await notifee.getBadgeCount();
    console.log('[Badge] setBadgeCount(0) done, badge after reset:', afterBadge);
  } catch (e) {
    console.log('[Badge] clearAllDeliveredNotifications error:', e);
  }
};

export const incrementBadgeCount = async () => {
  try {
    // Only increment badge when app is in background
    // In foreground, user is already seeing the app, no need for badge
    const { AppState } = require('react-native');
    if (AppState.currentState === 'active') {
      console.log('[Badge] incrementBadgeCount skipped (app is active)');
      return;
    }
    const current = await notifee.getBadgeCount();
    console.log('[Badge] incrementBadgeCount called, current:', current, '-> setting to:', current + 1);
    await notifee.setBadgeCount(current + 1);
  } catch (e) {
    console.log('[Badge] incrementBadgeCount error:', e);
  }
};

export const updateBadgeCount = async (_args: { count?: number } = {}) => {
  console.log('[Badge] updateBadgeCount called (no-op), count:', _args.count);
  // No-op: badge is now managed by APNS payload (background push)
  // and clearAllDeliveredNotifications (reset on foreground)
};

export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: Notification;
  installationUrl: string;
}) => {
  const { notificationType } = notification;

  if (NOTIFICATION_TYPES.includes(notificationType)) {
    const { primaryActor, primaryActorId, primaryActorType } = notification;
    let conversationId = null;
    if (primaryActorType === 'Conversation') {
      conversationId = primaryActor.id;
    } else if (primaryActorType === 'Message') {
      conversationId = primaryActor.conversationId;
    }
    if (conversationId) {
      const conversationLink = `${installationUrl}/app/accounts/1/conversations/${conversationId}/${primaryActorId}/${primaryActorType}`;
      return conversationLink;
    }
  }
  return;
};

interface FCMMessage {
  data?: {
    payload?: string;
    notification?: string;
  };
}

export const findNotificationFromFCM = ({ message }: { message: FCMMessage }) => {
  let notification = null;
  // FCM HTTP v1
  if (message?.data?.payload) {
    const parsedPayload = JSON.parse(message.data.payload);
    notification = parsedPayload.data.notification;
  }
  // FCM legacy. It will be deprecated soon
  else {
    notification = JSON.parse(message.data.notification);
  }
  return notification;
};
