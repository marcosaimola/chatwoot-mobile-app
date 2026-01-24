import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChatWindowContext, useRefsContext, useThemeContext } from '@/context';
import {
  useHaptic,
  isAWhatsAppChannel,
  isAnEmailChannel,
  isASmsInbox,
  isAFacebookInbox,
  isALineChannel,
  isATelegramChannel,
  isAWebWidgetInbox,
  isAPIInbox,
  isAnInstagramChannel,
} from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { MESSAGE_MAX_LENGTH, REPLY_EDITOR_MODES } from '@/constants';
import { tailwind } from '@/theme';
import {
  selectMessageContent,
  selectAttachments,
  selectQuoteMessage,
  resetSentMessage,
  selectIsPrivateMessage,
  togglePrivateMessage,
  setMessageContent,
} from '@/store/conversation/sendMessageSlice';
import { selectUserId, selectUserName, selectUserThumbnail } from '@/store/auth/authSelectors';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { selectInboxById } from '@/store/inbox/inboxSelectors';
import { conversationActions } from '@/store/conversation/conversationActions';

import { AddCommandButton } from './buttons/AddCommandButton';
import { SendMessageButton } from './buttons/SendMessageButton';
import { MessageTextInput } from './MessageTextInput';
import { QuoteReply } from './QuoteReply';
import { ReplyWarning } from './ReplyWarning';
import { CannedResponses } from './CannedResponses';
import { AttachedMedia } from '../message-components/AttachedMedia';
import { CommandOptionsMenu } from '../message-components/CommandOptionsMenu';
import { SendMessagePayload } from '@/store/conversation/conversationTypes';
import { TypingIndicator } from './TypingIndicator';
import { getTypingUsersText } from '@/utils';
import { selectTypingUsersByConversationId } from '@/store/conversation/conversationTypingSlice';
import { Agent, CannedResponse, Conversation } from '@/types';
import AnalyticsHelper from '@/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@/constants/analyticsEvents';
import {
  allMessageVariables,
  replaceMessageVariables,
  getAllUndefinedVariablesInMessage,
} from '@/utils/messageVariableUtils';
import { ReplyEmailHead } from './ReplyEmailHead';
import { getLastEmailInSelectedChat } from '@/store/conversation/conversationSelectors';
import { selectAssignableParticipantsByInboxId } from '@/store/assignable-agent/assignableAgentSelectors';
import { AudioRecorder } from '../audio-recorder/AudioRecorder';
import { VoiceRecordButton } from './buttons/VoiceRecordButton';

const SHEET_APPEAR_SPRING_CONFIG = {
  damping: 20,
  stiffness: 120,
};

// TODO: Implement this
// const globalConfig = {
//   directUploadsEnabled: true,
// };

const AnimatedKeyboardStickyView = Animated.createAnimatedComponent(KeyboardStickyView);
const BottomSheetContent = () => {
  const hapticSelection = useHaptic();
  const dispatch = useAppDispatch();
  const { colors } = useThemeContext();
  const { bottom } = useSafeAreaInsets();
  const { messageListRef } = useRefsContext();

  // Selectors
  const userId = useAppSelector(selectUserId);
  const userThumbnail = useAppSelector(selectUserThumbnail);
  const userName = useAppSelector(selectUserName);
  const messageContent = useAppSelector(selectMessageContent);
  const attachedFiles = useAppSelector(selectAttachments);
  const quoteMessage = useAppSelector(selectQuoteMessage);
  const isPrivate = useAppSelector(selectIsPrivateMessage);

  // Context
  const {
    isAddMenuOptionSheetOpen,
    setAddMenuOptionSheetState,
    textInputRef,
    isTextInputFocused,
    conversationId,
    isVoiceRecorderOpen,
    setIsVoiceRecorderOpen,
  } = useChatWindowContext();

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const { inboxId, canReply } = conversation || {};
  const inbox = useAppSelector(state => (inboxId ? selectInboxById(state, inboxId) : undefined));

  const selectAgents = useAppSelector(selectAssignableParticipantsByInboxId);
  const agents = inboxId ? selectAgents(inboxId, '') : [];

  const [replyEditorMode, setReplyEditorMode] = useState(REPLY_EDITOR_MODES.REPLY);
  const [ccEmails, setCCEmails] = useState('');
  const [bccEmails, setBCCEmails] = useState('');
  const [toEmails, setToEmails] = useState('');
  const [selectedCannedResponse, setSelectedCannedResponse] = useState<string | null>(null);

  const typingUsers = useAppSelector(selectTypingUsersByConversationId(conversationId));
  const typingText = useMemo(() => getTypingUsersText({ users: typingUsers }), [typingUsers]);

  const attachmentsLength = useMemo(() => attachedFiles.length, [attachedFiles.length]);

  const shouldShowReplyHeader = inbox && isAnEmailChannel(inbox) && !isPrivate;

  const lastEmail = useAppSelector(state =>
    shouldShowReplyHeader ? getLastEmailInSelectedChat(state, { conversationId }) : null,
  );

  useEffect(() => {
    if (!lastEmail) return;
    const {
      contentAttributes: { email: emailAttributes = {} },
    } = lastEmail;

    // Retrieve the email of the current conversation's sender
    const conversationContact = conversation?.meta?.sender?.email || '';
    let cc = emailAttributes.cc ? [...emailAttributes.cc] : [];
    let to = [];

    // there might be a situation where the current conversation will include a message from a third person,
    // and the current conversation contact is in CC.
    // This is an edge-case, reported here: CW-1511 [ONLY FOR INTERNAL REFERENCE]
    // So we remove the current conversation contact's email from the CC list if present
    if (cc.includes(conversationContact)) {
      cc = cc.filter(email => email !== conversationContact);
    }

    // If the last incoming message sender is different from the conversation contact, add them to the "to"
    // and add the conversation contact to the CC
    if (!emailAttributes.from.includes(conversationContact)) {
      to.push(...emailAttributes.from);
      cc.push(conversationContact);
    }

    // Remove the conversation contact's email from the BCC list if present
    let bcc = (emailAttributes.bcc || []).filter(email => email !== conversationContact);

    // Ensure only unique email addresses are in the CC list
    bcc = [...new Set(bcc)];
    cc = [...new Set(cc)];
    to = [...new Set(to)];
    setCCEmails(cc.join(', '));
    setBCCEmails(bcc.join(', '));
    setToEmails(to.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEmail]);

  const messageVariables = allMessageVariables({
    conversation: conversation as Conversation,
  });

  useEffect(() => {
    if (canReply || (inbox && isAWhatsAppChannel(inbox))) {
      setReplyEditorMode(REPLY_EDITOR_MODES.REPLY);
      dispatch(togglePrivateMessage(false));
    } else {
      setReplyEditorMode(REPLY_EDITOR_MODES.NOTE);
      dispatch(togglePrivateMessage(true));
    }
  }, [inbox, canReply, dispatch]);

  const derivedAddMenuOptionStateValue = useDerivedValue(() => {
    return isAddMenuOptionSheetOpen
      ? withSpring(1, SHEET_APPEAR_SPRING_CONFIG)
      : withSpring(0, SHEET_APPEAR_SPRING_CONFIG);
  });

  const animatedInputWrapperStyle = useAnimatedStyle(
    () => ({
      marginBottom: isTextInputFocused ? 0 : bottom,
    }),
    [isTextInputFocused],
  );

  const handleShowAddMenuOption = () => {
    if (isAddMenuOptionSheetOpen) {
      hapticSelection?.();
      setAddMenuOptionSheetState(false);
    } else {
      Keyboard.dismiss();
      hapticSelection?.();
      setAddMenuOptionSheetState(true);
    }
  };

  // TODO: Implement this
  const setReplyToInPayload = (messagePayload: Record<string, unknown>) => {
    //     ...(quoteMessage?.id && {
    //       contentAttributes: { inReplyTo: quoteMessage.id },
    //     }),
    return messagePayload;
  };

  const getMessagePayload = (message: string, audioFile: File | null) => {
    let updatedMessage = message;
    if (isPrivate) {
      const regex = /@\[([\w\s]+)\]\((\d+)\)/g;
      updatedMessage = message.replace(
        regex,
        '[@$1](mention://user/$2/' + encodeURIComponent('$1') + ')',
      );
    }

    let messagePayload = {
      conversationId,
      message: updatedMessage,
      private: isPrivate,
      sender: {
        id: userId ?? 0,
        thumbnail: userThumbnail ?? '',
        name: userName ?? '',
      },
      files: [],
    } as SendMessagePayload;

    messagePayload = setReplyToInPayload(messagePayload);

    if (audioFile) {
      messagePayload.file = audioFile;
    }

    if (attachedFiles && attachedFiles.length) {
      // Separate images from other files
      const images = attachedFiles.filter(att => att.type?.includes('image'));
      const nonImages = attachedFiles.filter(att => !att.type?.includes('image'));
      
      // Images go to files[] (up to 10)
      if (images.length > 0) {
        messagePayload.files = images;
      }
      
      // Non-images go to file (only 1, take the first one)
      if (nonImages.length > 0) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        messagePayload.file = nonImages[0];
      }
    }

    // TODO: Implement this
    if (ccEmails && !isPrivate) {
      messagePayload.ccEmails = ccEmails;
    }

    if (bccEmails && !isPrivate) {
      messagePayload.bccEmails = bccEmails;
    }

    if (toEmails && !isPrivate) {
      messagePayload.toEmails = toEmails;
    }

    return messagePayload;
  };

  const onRecordingComplete = async (audioFile: File | null) => {
    confirmOnSendReply(audioFile);
  };

  const confirmOnSendReply = async (audioFile: File | null) => {
    hapticSelection?.();
    if (textInputRef && 'current' in textInputRef && textInputRef.current) {
      (textInputRef.current as TextInput).clear();
    }

    AnalyticsHelper.track(CONVERSATION_EVENTS.SENT_MESSAGE);

    const undefinedVariables = getAllUndefinedVariablesInMessage({
      message: messageContent,
      variables: messageVariables,
    });

    if (undefinedVariables.length > 0) {
      const undefinedVariablesCount = undefinedVariables.length > 1 ? undefinedVariables.length : 1;
      const undefinedVariablesText = undefinedVariables.join(', ');
      const undefinedVariablesMessage = `You have ${undefinedVariablesCount} undefined variable(s) in your message: ${undefinedVariablesText}. Please check and try again with valid variables.`;
      Alert.alert(undefinedVariablesMessage);
    } else {
      const messagePayload = getMessagePayload(messageContent, audioFile);
      await sendMessage(messagePayload);
    }
  };

  const sendMessage = async (messagePayload: SendMessagePayload) => {
    // Check if we have multiple images - if so, send one message per image
    const hasMultipleImages = messagePayload.files && messagePayload.files.length > 1;
    
    if (hasMultipleImages && messagePayload.files) {
      // Send multiple messages, one for each image
      // First message includes the text (if any), subsequent messages are image-only
      const images = messagePayload.files;
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const isFirstImage = i === 0;
        
        const singleImagePayload: SendMessagePayload = {
          ...messagePayload,
          files: undefined, // Remove files array
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error - Asset type is compatible with File type in this context
          file: image, // Use single file
          message: isFirstImage ? messagePayload.message : '', // Only first image gets the text
        };
        
        await dispatch(conversationActions.sendMessage(singleImagePayload));
        
        // Small delay between messages to avoid rate limiting
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } else if (messagePayload.files && messagePayload.files.length === 1) {
      // Single image - convert to file format
      const singleImagePayload: SendMessagePayload = {
        ...messagePayload,
        files: undefined,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - Asset type is compatible with File type in this context
        file: messagePayload.files[0],
      };
      await dispatch(conversationActions.sendMessage(singleImagePayload));
    } else {
      // Single file or no files - send normally
      await dispatch(conversationActions.sendMessage(messagePayload));
    }
    
    dispatch(resetSentMessage());
    setSelectedCannedResponse(null);
    dispatch(setMessageContent(''));
    setCCEmails('');
    setBCCEmails('');
    setToEmails('');
    messageListRef?.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const shouldShowFileUpload =
    inbox &&
    (isAWebWidgetInbox(inbox) ||
      isAFacebookInbox(inbox) ||
      isAWhatsAppChannel(inbox) ||
      isAPIInbox(inbox) ||
      isASmsInbox(inbox) ||
      isAnEmailChannel(inbox) ||
      isATelegramChannel(inbox) ||
      isALineChannel(inbox) ||
      isAnInstagramChannel(inbox));

  const maxLength = () => {
    if (isPrivate) {
      return MESSAGE_MAX_LENGTH.GENERAL;
    }
    if (isAFacebookInbox(inbox)) {
      return MESSAGE_MAX_LENGTH.FACEBOOK;
    }
    if (isAWhatsAppChannel(inbox)) {
      return MESSAGE_MAX_LENGTH.TWILIO_WHATSAPP;
    }
    if (isASmsInbox(inbox)) {
      return MESSAGE_MAX_LENGTH.TWILIO_SMS;
    }
    if (isAnEmailChannel(inbox)) {
      return MESSAGE_MAX_LENGTH.EMAIL;
    }
    return MESSAGE_MAX_LENGTH.GENERAL;
  };

  const audioFormat = (): 'audio/m4a' | 'audio/wav' => {
    if (isAWhatsAppChannel(inbox) || isATelegramChannel(inbox) || isAnInstagramChannel(inbox)) {
      return 'audio/m4a';
    }
    return 'audio/wav';
  };

  const onSelectCannedResponse = (cannedResponse: CannedResponse) => {
    const updatedContent = replaceMessageVariables({
      message: cannedResponse.content,
      variables: messageVariables,
    });
    AnalyticsHelper.track(CONVERSATION_EVENTS.INSERTED_A_CANNED_RESPONSE);
    setSelectedCannedResponse(updatedContent);
  };

  const onPressVoiceRecordIcon = () => {
    setIsVoiceRecorderOpen(true);
    setAddMenuOptionSheetState(false);
  };

  const shouldShowCannedResponses = messageContent?.charAt(0) === '/';

  return (
    <AnimatedKeyboardStickyView style={[tailwind.style(colors.bgPrimary), animatedInputWrapperStyle]}>
      {!canReply && inbox && conversation && (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(10)}>
          <ReplyWarning inbox={inbox} conversation={conversation} />
        </Animated.View>
      )}
      {shouldShowCannedResponses && (
        <CannedResponses searchKey={messageContent} onSelect={onSelectCannedResponse} />
      )}

      <Animated.View
        layout={LinearTransition.springify().damping(38).stiffness(240)}
        style={tailwind.style(
          `pb-2 border-t-[1px] ${colors.borderPrimary} ${shouldShowReplyHeader ? 'pt-0' : 'pt-2'}`,
        )}>
        {quoteMessage && (
          <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(10)}>
            <QuoteReply />s
          </Animated.View>
        )}

        {shouldShowReplyHeader && (
          <ReplyEmailHead
            ccEmails={ccEmails}
            bccEmails={bccEmails}
            toEmails={toEmails}
            onUpdateCC={setCCEmails}
            onUpdateBCC={setBCCEmails}
            onUpdateTo={setToEmails}
          />
        )}

        {typingText && <TypingIndicator typingText={typingText} />}

        {isVoiceRecorderOpen ? (
          <AudioRecorder onRecordingComplete={onRecordingComplete} audioFormat={audioFormat()} />
        ) : null}
        {!isVoiceRecorderOpen ? (
          <Animated.View style={tailwind.style('flex flex-row px-1 items-end z-20 relative')}>
            {attachmentsLength === 0 && shouldShowFileUpload && (
              <AddCommandButton
                onPress={handleShowAddMenuOption}
                derivedAddMenuOptionStateValue={derivedAddMenuOptionStateValue}
              />
            )}
            <MessageTextInput
              maxLength={maxLength()}
              replyEditorMode={replyEditorMode}
              selectedCannedResponse={selectedCannedResponse}
              agents={agents as Agent[]}
              messageContent={messageContent}
            />
            {(messageContent.length > 0 || attachmentsLength > 0) && (
              <SendMessageButton onPress={() => confirmOnSendReply(null)} />
            )}
            {messageContent.length === 0 && attachmentsLength === 0 && shouldShowFileUpload ? (
              <VoiceRecordButton onPress={onPressVoiceRecordIcon} />
            ) : null}
          </Animated.View>
        ) : null}
      </Animated.View>

      {isAddMenuOptionSheetOpen ? (
        <CommandOptionsMenu />
      ) : attachmentsLength > 0 ? (
        <AttachedMedia />
      ) : null}
    </AnimatedKeyboardStickyView>
  );
};

export const ReplyBoxContainer = () => {
  return <BottomSheetContent />;
};
