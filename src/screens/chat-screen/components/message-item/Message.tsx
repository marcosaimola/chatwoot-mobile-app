import React from 'react';
import { Channel, Message } from '@/types';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { useChatWindowContext, useThemeContext } from '@/context';
import { conversationActions } from '@/store/conversation/conversationActions';
import { unixTimestampToReadableTime, useHaptic } from '@/utils';
import {
  ComposedBubble,
  DeliveryStatus,
  TextBubble,
  ActivityBubble,
  // LocationBubble,
  // ImageBubble,
  // AudioBubble,
  // VideoBubble,
  // FileBubble,
  EmailBubble,
  UnsupportedBubble,
} from '../message-components';
import { showToast } from '@/utils/toastUtils';
import {
  // ATTACHMENT_TYPES,
  MESSAGE_STATUS,
  MESSAGE_VARIANTS,
  ORIENTATION,
  SENDER_TYPES,
  TEXT_MAX_WIDTH,
  CONTENT_TYPES,
  MESSAGE_TYPES,
} from '@/constants';
import i18n from '@/i18n';
import Clipboard from '@react-native-clipboard/clipboard';
import { CopyIcon, Trash, ReplyIcon, ForwardIcon, CheckedIcon, UncheckedIcon } from '@/svg-icons';
import { MenuOption, MessageMenu } from '../message-menu';
import { setQuoteMessage } from '@/store/conversation/sendMessageSlice';
import {
  enterForwardMode,
  toggleMessageSelection,
  selectIsForwardMode,
  selectIsMessageSelected,
} from '@/store/conversation/forwardMessageSlice';
import { SendMessagePayload } from '@/store/conversation/conversationTypes';
import { selectUserId, selectUserThumbnail, selectUserName } from '@/store/auth/authSelectors';
import { tailwind } from '@/theme';
import { Dimensions, View, Pressable } from 'react-native';
import { Avatar } from '@/components-next';

// import { ImageMetadata } from '@/types';

type MessageComponentProps = {
  item: Message;
  index: number;
  isEmailInbox: boolean;
  currentUserId: number;
};

type MessageWrapperProps = {
  children: React.ReactNode;
  item: Message;
  orientation: string;
  shouldGroupWithPrevious: boolean;
  shouldGroupWithNext: boolean;
  shouldShowAvatar: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  avatarInfo: { name: string | null | undefined; src: any }; // Updated type
  getMenuOptions: (message: Message) => MenuOption[];
  variant: string;
  channel?: Channel;
  onEmojiReply?: (emoji: string) => void;
  showEmojiRow?: boolean;
};

const getVariantTextMap = (isDark: boolean) => ({
  [MESSAGE_VARIANTS.AGENT]: isDark ? 'text-gray-200' : 'text-gray-700',
  [MESSAGE_VARIANTS.USER]: 'text-white',
  [MESSAGE_VARIANTS.BOT]: isDark ? 'text-gray-200' : 'text-gray-700',
  [MESSAGE_VARIANTS.TEMPLATE]: isDark ? 'text-gray-200' : 'text-gray-700',
  [MESSAGE_VARIANTS.ERROR]: 'text-white',
});

const getVariantBaseMap = (isDark: boolean) => ({
  [MESSAGE_VARIANTS.AGENT]: isDark ? 'bg-gray-800/80' : 'bg-gray-100',
  [MESSAGE_VARIANTS.PRIVATE]: isDark ? 'bg-amber-900/60' : 'bg-amber-100',
  [MESSAGE_VARIANTS.USER]: isDark ? 'bg-blue-800/80' : 'bg-blue-700',
  [MESSAGE_VARIANTS.BOT]: isDark ? 'bg-blue-900/60' : 'bg-blue-100',
  [MESSAGE_VARIANTS.TEMPLATE]: isDark ? 'bg-blue-900/60' : 'bg-blue-100',
  [MESSAGE_VARIANTS.ERROR]: isDark ? 'bg-ruby-800/80' : 'bg-ruby-700',
  [MESSAGE_VARIANTS.EMAIL]: isDark ? 'bg-gray-800/80' : 'bg-gray-100',
  [MESSAGE_VARIANTS.UNSUPPORTED]: isDark
    ? 'bg-amber-900/60 border border-dashed border-amber-600'
    : 'bg-amber-100 border border-dashed border-amber-700',
});

const getVariantBorderMap = (isDark: boolean) => ({
  [MESSAGE_VARIANTS.AGENT]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.USER]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.BOT]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.TEMPLATE]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.ERROR]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.EMAIL]: isDark ? 'border-gray-700' : 'border-gray-100',
  [MESSAGE_VARIANTS.UNSUPPORTED]: isDark ? 'border-gray-700' : 'border-gray-100',
});

const MessageWrapper = ({
  children,
  item,
  orientation,
  shouldGroupWithPrevious,
  shouldGroupWithNext,
  shouldShowAvatar,
  avatarInfo,
  getMenuOptions,
  variant,
  channel,
  onEmojiReply,
  showEmojiRow,
}: MessageWrapperProps) => {
  const { isDark } = useThemeContext();
  const variantBaseMap = getVariantBaseMap(isDark);
  const variantBorderMap = getVariantBorderMap(isDark);
  const variantTextMap = getVariantTextMap(isDark);

  const flexOrientationClass = () => {
    const map = {
      [ORIENTATION.LEFT]: 'items-start',
      [ORIENTATION.RIGHT]: 'items-end',
      [ORIENTATION.CENTER]: 'items-center',
    };
    return map[orientation];
  };

  const windowWidth = Dimensions.get('window').width;
  // 52 is the sum of the left and right padding (12 + 12) and avatar width (24) and gap between avatar and message (4)
  const EMAIL_WIDTH = windowWidth - 52;

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[
        tailwind.style(
          'my-[1px]',
          flexOrientationClass(),
          shouldGroupWithPrevious && orientation === ORIENTATION.LEFT ? 'ml-7' : '',
          !shouldGroupWithPrevious && !shouldGroupWithNext ? 'mb-2' : 'mb-1',
          item.private ? 'my-1' : '',
        ),
      ]}>
      <Animated.View style={tailwind.style('flex flex-row')}>
        {!shouldGroupWithPrevious && shouldShowAvatar ? (
          <Animated.View style={tailwind.style('flex items-end justify-end mr-1')}>
            <Avatar size={'md'} src={avatarInfo.src} name={avatarInfo.name || ''} />
          </Animated.View>
        ) : null}
        <MessageMenu
          menuOptions={getMenuOptions(item)}
          onEmojiReply={onEmojiReply}
          showEmojiRow={showEmojiRow}
          message={item}
          messageVariant={variant}>
          <Animated.View
            style={[
              tailwind.style(
                'relative pl-3 pr-2.5 py-2 rounded-2xl overflow-hidden',
                `${variant === MESSAGE_VARIANTS.EMAIL ? `max-w-[${EMAIL_WIDTH}px]` : `max-w-[${TEXT_MAX_WIDTH}px]`}`,
                variantBaseMap[variant],
                variantBorderMap[variant],
                shouldGroupWithNext && shouldGroupWithPrevious
                  ? orientation === ORIENTATION.LEFT
                    ? 'rounded-l-none'
                    : 'rounded-r-none'
                  : '',
                shouldGroupWithNext && !shouldGroupWithPrevious
                  ? orientation === ORIENTATION.LEFT
                    ? 'rounded-tl-none'
                    : 'rounded-tr-none'
                  : '',
                !shouldGroupWithNext && shouldGroupWithPrevious
                  ? orientation === ORIENTATION.LEFT
                    ? 'rounded-bl-none'
                    : 'rounded-br-none'
                  : '',
              ),
            ]}>
            {children}
            {!shouldGroupWithPrevious && (
              <Animated.View
                style={tailwind.style(
                  'h-[21px] pt-[5px] pb-0.5 flex flex-row items-center justify-end',
                )}>
                <Animated.Text
                  style={tailwind.style(
                    'text-xs font-inter-420-20 tracking-[0.32px] pr-1',
                    variantTextMap[variant],
                  )}>
                  {unixTimestampToReadableTime(item.createdAt)}
                </Animated.Text>
                <DeliveryStatus
                  isPrivate={item.private}
                  status={item.status}
                  messageType={item.messageType}
                  channel={channel}
                  sourceId={item.sourceId}
                  errorMessage={item.contentAttributes?.externalError || ''}
                  deliveredColor={isDark ? 'text-gray-400' : 'text-gray-700'}
                  sentColor={isDark ? 'text-gray-400' : 'text-gray-700'}
                />
              </Animated.View>
            )}
          </Animated.View>
        </MessageMenu>
      </Animated.View>
    </Animated.View>
  );
};

export const MessageComponent = (props: MessageComponentProps) => {
  const dispatch = useAppDispatch();
  const { conversationId } = useChatWindowContext();
  const { isDark } = useThemeContext();
  const { item, currentUserId, isEmailInbox } = props;
  const {
    messageType,
    contentType,
    status,
    sender,
    groupWithNext,
    groupWithPrevious,
    senderId,
    senderType,
  } = item;

  const hapticSelection = useHaptic();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const channel = conversation?.channel || conversation?.meta?.channel;
  const userId = useAppSelector(selectUserId);
  const userThumbnail = useAppSelector(selectUserThumbnail);
  const userName = useAppSelector(selectUserName);

  // Forward mode state
  const isForwardMode = useAppSelector(selectIsForwardMode);
  const isSelected = useAppSelector(state => selectIsMessageSelected(state, item.id));

  const handleToggleSelection = () => {
    hapticSelection?.();
    dispatch(toggleMessageSelection(item));
  };

  const variant = () => {
    if (item.private) return MESSAGE_VARIANTS.PRIVATE;
    if (isEmailInbox) {
      const emailInboxTypes = [MESSAGE_TYPES.INCOMING, MESSAGE_TYPES.OUTGOING];
      if (emailInboxTypes.includes(messageType)) {
        return MESSAGE_VARIANTS.EMAIL;
      }
    }
    if (contentType === CONTENT_TYPES.INCOMING_EMAIL) {
      return MESSAGE_VARIANTS.EMAIL;
    }
    if (status === MESSAGE_STATUS.FAILED) return MESSAGE_VARIANTS.ERROR;
    if (item.contentAttributes?.isUnsupported) return MESSAGE_VARIANTS.UNSUPPORTED;

    const isBot = !sender || sender.type === SENDER_TYPES.AGENT_BOT;
    if (isBot && messageType === MESSAGE_TYPES.OUTGOING) {
      return MESSAGE_VARIANTS.BOT;
    }

    const variants = {
      [MESSAGE_TYPES.INCOMING]: MESSAGE_VARIANTS.USER,
      [MESSAGE_TYPES.ACTIVITY]: MESSAGE_VARIANTS.ACTIVITY,
      [MESSAGE_TYPES.OUTGOING]: MESSAGE_VARIANTS.AGENT,
      [MESSAGE_TYPES.TEMPLATE]: MESSAGE_VARIANTS.TEMPLATE,
    };

    return variants[messageType] || MESSAGE_VARIANTS.USER;
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

  const handleQuoteReplyAttachment = (message: Message) => {
    hapticSelection?.();
    dispatch(setQuoteMessage(message));
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
        handleOnPressMenuOption: () => handleQuoteReplyAttachment(message),
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

  const shouldShowAvatar = () => {
    if (messageType === MESSAGE_TYPES.ACTIVITY) return false;
    if (orientation() === ORIENTATION.RIGHT) return false;
    return true;
  };

  const isMyMessage = () => {
    if (status === MESSAGE_STATUS.PROGRESS && messageType === MESSAGE_TYPES.OUTGOING) {
      return true;
    }

    const senderIdentifier = senderId ?? sender?.id;
    const senderTypeValue = senderType ?? sender?.type;

    if (!senderTypeValue || !senderIdentifier) {
      return false;
    }

    return (
      senderTypeValue.toLowerCase() === SENDER_TYPES.USER.toLowerCase() &&
      currentUserId === senderIdentifier
    );
  };

  const orientation = () => {
    if (isMyMessage()) {
      return ORIENTATION.RIGHT;
    }
    if (messageType === MESSAGE_TYPES.ACTIVITY) return ORIENTATION.CENTER;
    return ORIENTATION.LEFT;
  };

  const shouldGroupWithNext = () => {
    if (status === MESSAGE_STATUS.FAILED) return false;
    return groupWithNext ?? false;
  };

  const shouldGroupWithPrevious = () => {
    if (status === MESSAGE_STATUS.FAILED) return false;
    return groupWithPrevious ?? false;
  };

  const avatarInfo = () => {
    if (!sender || sender.type === SENDER_TYPES.AGENT_BOT) {
      return {
        name: i18n.t('CONVERSATION.BOT'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        src: require('../../../../assets/local/bot-avatar.png'),
      };
    }

    return {
      name: sender?.name || '',
      src: {
        uri: sender?.thumbnail || null,
      },
    };
  };
  // TODO: Add this once we have a proper way to render single attachments
  // const renderSingleAttachment = (attachment: ImageMetadata) => {
  //   switch (attachment.fileType) {
  //     case ATTACHMENT_TYPES.LOCATION:
  //       return (
  //         <LocationBubble
  //           latitude={attachment.coordinatesLat ?? 0}
  //           longitude={attachment.coordinatesLong ?? 0}
  //           variant={variant()}
  //         />
  //       );
  //     case ATTACHMENT_TYPES.IMAGE:
  //       return <ImageBubble imageSrc={attachment.dataUrl} />;
  //     case ATTACHMENT_TYPES.AUDIO:
  //       return <AudioBubble audioSrc={attachment.dataUrl} variant={variant()} />;
  //     case ATTACHMENT_TYPES.VIDEO:
  //       return <VideoBubble videoSrc={attachment.dataUrl} />;
  //     case ATTACHMENT_TYPES.FILE:
  //       return <FileBubble fileSrc={attachment.dataUrl} variant={variant()} />;
  //     default:
  //       return <TextBubble item={item} variant={variant()} />;
  //   }
  // };

  const renderMessageContent = () => {
    if (messageType === MESSAGE_TYPES.ACTIVITY) {
      return <ActivityBubble text={item.content} timeStamp={item.createdAt} />;
    }

    const attachments = item.attachments;
    const isReplyMessage = item.contentAttributes?.inReplyTo;
    const isUnsupported = item.contentAttributes?.isUnsupported;
    let messageContent;

    if (isUnsupported) {
      messageContent = <UnsupportedBubble />;
    } else if (contentType === CONTENT_TYPES.INCOMING_EMAIL) {
      messageContent = <EmailBubble item={item} variant={variant()} />;
    } else if (isEmailInbox && !item.private) {
      messageContent = <EmailBubble item={item} variant={variant()} />;
    }
    // TODO: Add this once we have a proper way to render single attachments
    // else if (attachments?.length === 1 && !item.content && !isReplyMessage) {
    //   messageContent = renderSingleAttachment(attachments[0]);
    // }
    else if (attachments?.length >= 1 || isReplyMessage) {
      messageContent = <ComposedBubble item={item} variant={variant()} />;
    } else if (item.content) {
      messageContent = <TextBubble item={item} variant={variant()} />;
    } else {
      return <View />;
    }

    const emojiHandler = getEmojiReplyHandler(item);
    const messageElement = (
      <MessageWrapper
        item={item}
        orientation={orientation()}
        shouldGroupWithPrevious={shouldGroupWithPrevious()}
        shouldGroupWithNext={shouldGroupWithNext()}
        shouldShowAvatar={shouldShowAvatar()}
        avatarInfo={avatarInfo()}
        getMenuOptions={isForwardMode ? () => [] : getMenuOptions}
        variant={variant()}
        channel={channel}
        onEmojiReply={isForwardMode ? undefined : emojiHandler}
        showEmojiRow={isForwardMode ? false : !!emojiHandler}>
        {messageContent}
      </MessageWrapper>
    );

    // In forward mode, wrap with checkbox
    if (isForwardMode) {
      const isDeleted = item.contentAttributes?.deleted;
      const canSelect = messageType !== MESSAGE_TYPES.ACTIVITY && !isDeleted && !item.private;

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
            {messageElement}
          </View>
        </Pressable>
      );
    }

    return messageElement;
  };

  return renderMessageContent();
};
