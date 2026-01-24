import React from 'react';

import {
  ChatwootIcon,
  WebsiteFilledIcon,
  MailFilledIcon,
  TelegramFilledIcon,
  XFilledIcon,
  WhatsAppFilledIcon,
  InstagramFilledIcon,
  MessengerFilledIcon,
  SMSFilledIcon,
} from '@/svg-icons';

import { Channel, InboxTypes } from '@/types';
import { LineFilledIcon } from '@/svg-icons/channels/Line';

const isTwilioChannel = (channelType: Channel) => {
  return channelType === InboxTypes.TWILIO;
};

const isFacebookChannel = (channelType: Channel) => {
  return channelType === InboxTypes.FB;
};

const isATwilioSMSChannel = (channelType: Channel, medium: string) => {
  return isTwilioChannel(channelType) && medium === 'sms';
};

const isAWhatsAppChannel = (channelType: Channel) => {
  return channelType === InboxTypes.WHATSAPP;
};

// Gray color that works on both light and dark backgrounds
const CHANNEL_ICON_COLOR = '#6B7280';

export const getChannelIcon = (channelType: Channel, medium: string, additionalType: string) => {
  if (isFacebookChannel(channelType)) {
    if (additionalType === 'instagram_direct_message') {
      return <InstagramFilledIcon color={CHANNEL_ICON_COLOR} />;
    }
    return <MessengerFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (isTwilioChannel(channelType)) {
    if (isATwilioSMSChannel(channelType, medium)) {
      return <SMSFilledIcon color={CHANNEL_ICON_COLOR} />;
    }
    return <WhatsAppFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (isAWhatsAppChannel(channelType)) {
    return <WhatsAppFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.WEB) {
    return <WebsiteFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.EMAIL) {
    return <MailFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.TELEGRAM) {
    return <TelegramFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.LINE) {
    return <LineFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.SMS) {
    return <SMSFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  if (channelType === InboxTypes.TWITTER) {
    return <XFilledIcon color={CHANNEL_ICON_COLOR} />;
  }

  return <WebsiteFilledIcon color={CHANNEL_ICON_COLOR} />;
};
