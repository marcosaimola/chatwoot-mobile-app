import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Message } from '@/types';
import { SendMessagePayload } from '@/store/conversation/conversationTypes';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { useChatWindowContext, useThemeContext } from '@/context';
import { setQuoteMessage } from '@/store/conversation/sendMessageSlice';
import {
  enterForwardMode,
  toggleMessageSelection,
  selectIsForwardMode,
  selectIsMessageSelected,
} from '@/store/conversation/forwardMessageSlice';
import { conversationActions } from '@/store/conversation/conversationActions';
import { useHaptic } from '@/utils';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';
import Clipboard from '@react-native-clipboard/clipboard';
import { MESSAGE_TYPES } from '@/constants';
import { CopyIcon, Trash, ReplyIcon, ForwardIcon, CheckedIcon, UncheckedIcon } from '@/svg-icons';
import { MenuOption } from '../message-menu';
import { MessageItem } from './MessageItem';
import { selectUserId, selectUserThumbnail, selectUserName } from '@/store/auth/authSelectors';
import { tailwind } from '@/theme';

type MessageItemContainerProps = {
  item: { date: string } | Message;
  index: number;
};

export const MessageItemContainer = (props: MessageItemContainerProps) => {
  const dispatch = useAppDispatch();
  const { conversationId } = useChatWindowContext();
  const { isDark } = useThemeContext();

  const hapticSelection = useHaptic();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const userId = useAppSelector(selectUserId);
  const userThumbnail = useAppSelector(selectUserThumbnail);
  const userName = useAppSelector(selectUserName);

  // Forward mode state
  const isForwardMode = useAppSelector(selectIsForwardMode);
  const isMessage = !('date' in props.item);
  const messageId = isMessage ? (props.item as Message).id : 0;
  const isSelected = useAppSelector(state =>
    isMessage ? selectIsMessageSelected(state, messageId) : false,
  );

  const handleToggleSelection = () => {
    if (isMessage) {
      hapticSelection?.();
      dispatch(toggleMessageSelection(props.item as Message));
    }
  };

  const handleQuoteReplyAttachment = () => {
    hapticSelection?.();
    dispatch(setQuoteMessage(props.item as Message));
  };

  const handleCopyMessage = (content: string) => {
    hapticSelection?.();
    if (content) {
      Clipboard.setString(content);
      showToast({ message: i18n.t('CONVERSATION.COPY_MESSAGE') });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    await dispatch(conversationActions.deleteMessage({ conversationId, messageId }));
    showToast({ message: i18n.t('CONVERSATION.DELETE_MESSAGE_SUCCESS') });
  };

  const handleForwardMessage = (message: Message) => {
    hapticSelection?.();
    dispatch(enterForwardMode(message));
  };

  const handleEmojiReply = async (emoji: string, messageId: number) => {
    hapticSelection?.();
    const payload = {
      conversationId,
      message: emoji,
      private: false,
      sender: {
        id: userId ?? 0,
        thumbnail: userThumbnail ?? '',
        name: userName ?? '',
      },
      contentAttributes: { inReplyTo: messageId },
    } as SendMessagePayload;
    await dispatch(conversationActions.sendMessage(payload));
  };

  const getEmojiReplyHandler = (message: Message) => {
    const { messageType, private: isPrivate } = message;
    const isDeleted = message.contentAttributes?.deleted;

    // Don't show emoji row for activity messages, deleted messages, or private messages
    if (messageType === MESSAGE_TYPES.ACTIVITY || isDeleted || isPrivate) {
      return undefined;
    }

    return (emoji: string) => handleEmojiReply(emoji, message.id);
  };

  const getMenuOptions = (message: Message): MenuOption[] => {
    const { messageType, content, attachments, private: isPrivate } = message;
    const hasText = !!content;
    const hasAttachments = !!(attachments && attachments.length > 0);

    const isDeleted = message.contentAttributes?.deleted;

    const menuOptions: MenuOption[] = [];
    if (messageType === MESSAGE_TYPES.ACTIVITY || isDeleted) {
      return [];
    }

    // Reply option - available for non-private messages
    if (!isPrivate) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.REPLY'),
        icon: <ReplyIcon />,
        handleOnPressMenuOption: handleQuoteReplyAttachment,
        destructive: false,
      });
    }

    if (hasText) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.COPY'),
        icon: <CopyIcon />,
        handleOnPressMenuOption: () => handleCopyMessage(content),
        destructive: false,
      });
    }

    // Forward option - available for non-private messages with content
    if (!isPrivate && (hasText || hasAttachments)) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.FORWARD'),
        icon: <ForwardIcon />,
        handleOnPressMenuOption: () => handleForwardMessage(message),
        destructive: false,
      });
    }

    if (hasAttachments || hasText) {
      menuOptions.push({
        title: i18n.t('CONVERSATION.LONG_PRESS_ACTIONS.DELETE_MESSAGE'),
        icon: <Trash />,
        handleOnPressMenuOption: () => handleDeleteMessage(message.id),
        destructive: true,
      });
    }

    return menuOptions;
  };

  // Render with forward mode checkbox
  if (isForwardMode && isMessage) {
    const message = props.item as Message;
    const { messageType, private: isPrivate } = message;
    const isDeleted = message.contentAttributes?.deleted;
    const canSelect =
      messageType !== MESSAGE_TYPES.ACTIVITY && !isDeleted && !isPrivate;

    return (
      <Pressable
        onPress={canSelect ? handleToggleSelection : undefined}
        style={tailwind.style('flex-row items-center')}>
        {/* Checkbox */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={tailwind.style('w-12 items-center justify-center')}>
          {canSelect && (
            <View style={tailwind.style('w-6 h-6')}>
              {isSelected ? (
                <CheckedIcon />
              ) : (
                <UncheckedIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />
              )}
            </View>
          )}
        </Animated.View>

        {/* Message */}
        <View style={tailwind.style('flex-1')}>
          <MessageItem
            item={props.item}
            channel={conversation?.channel || conversation?.meta?.channel}
            getMenuOptions={() => []} // Disable menu in forward mode
            getEmojiReplyHandler={() => undefined} // Disable emoji in forward mode
          />
        </View>
      </Pressable>
    );
  }

  return (
    <MessageItem
      item={props.item}
      channel={conversation?.channel || conversation?.meta?.channel}
      getMenuOptions={getMenuOptions}
      getEmojiReplyHandler={getEmojiReplyHandler}
    />
  );
};
