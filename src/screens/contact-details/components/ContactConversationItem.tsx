import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';

import { useAppSelector } from '@/hooks';
import { Conversation } from '@/types';
import { selectInboxById } from '@/store/inbox/inboxSelectors';
import { selectContactById } from '@/store/contact/contactSelectors';
import { selectAllLabels } from '@/store/label/labelSelectors';
import { getLastMessage } from '@/utils';
import { ConversationItem } from '@/screens/conversations/components/conversation-item/ConversationItem';
import { tailwind } from '@/theme';

type ContactConversationItemProps = {
  conversation: Conversation;
};

export const ContactConversationItem = (props: ContactConversationItemProps) => {
  const { conversation } = props;
  const {
    meta: {
      sender: { name: senderName, thumbnail: senderThumbnail, id: contactId },
      assignee,
    },
    id,
    priority,
    unreadCount,
    labels,
    timestamp,
    inboxId,
    lastNonActivityMessage,
    slaPolicyId,
    appliedSla,
    firstReplyCreatedAt,
    waitingSince,
    status,
    additionalAttributes,
  } = conversation;

  const navigation = useNavigation();

  const allLabels = useAppSelector(selectAllLabels);
  const contact = useAppSelector(state => selectContactById(state, contactId));
  const inbox = useAppSelector(state => selectInboxById(state, inboxId));

  const { availabilityStatus, name: contactName, thumbnail: contactThumbnail } = contact || {};
  const lastMessage = getLastMessage(conversation);

  const handlePress = useCallback(() => {
    navigation.navigate('ChatScreen', {
      conversationId: id,
      isConversationOpenedExternally: false,
    });
  }, [navigation, id]);

  const viewProps = {
    id,
    senderName: contactName || senderName,
    senderThumbnail: contactThumbnail || senderThumbnail,
    isSelected: false,
    currentState: 'none' as const,
    unreadCount,
    isTyping: false,
    availabilityStatus: availabilityStatus || 'offline',
    priority,
    labels,
    timestamp,
    inbox: inbox || null,
    lastNonActivityMessage,
    lastMessage,
    inboxId,
    assignee: assignee || null,
    slaPolicyId,
    appliedSla: appliedSla || null,
    appliedSlaConversationDetails: {
      firstReplyCreatedAt,
      waitingSince,
      status,
    },
    additionalAttributes,
    allLabels,
    typingText: undefined,
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={tailwind.style('w-full')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <ConversationItem {...viewProps} />
    </TouchableOpacity>
  );
};
