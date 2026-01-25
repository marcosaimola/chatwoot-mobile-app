import { Channel } from './common/Channel';
import { WhatsAppTemplate } from './WhatsAppTemplate';

export type Inbox = {
  id: number;
  avatarUrl: string;
  channelId: number;
  name: string;
  channelType: Channel;
  phoneNumber: string;
  medium: string;
  additionalAttributes?: {
    agentReplyTimeWindowMessage?: string;
  };
  provider: string;
  messageTemplates?: WhatsAppTemplate[];
};
