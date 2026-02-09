import React, { PropsWithChildren, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { tailwind } from '@/theme';
import { Icon } from '@/components-next/common';
import { useHaptic } from '@/utils';
import { Message } from '@/types';
import {
  AudioIcon,
  DocumentAttachmentIcon,
  ImageAttachmentIcon,
  MapIcon,
  VideoCall,
} from '@/svg-icons';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏'];

export type MenuOption = {
  title: string;
  icon: React.ReactNode | JSX.Element;
  handleOnPressMenuOption: () => void;
  destructive?: boolean;
};

type MessageMenuProps = {
  menuOptions: MenuOption[];
  onEmojiReply?: (emoji: string) => void;
  showEmojiRow?: boolean;
  message?: Message;
  messageVariant?: string;
};

// Helper to get attachment icon
const getAttachmentIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <ImageAttachmentIcon />;
    case 'video':
      return <VideoCall />;
    case 'audio':
      return <AudioIcon />;
    case 'location':
      return <MapIcon fill="#646464" />;
    default:
      return <DocumentAttachmentIcon />;
  }
};

// Helper to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Message variant colors
const getPreviewColors = (variant?: string) => {
  switch (variant) {
    case 'user': // Incoming message (contact) - blue
      return {
        bg: 'bg-blue-700',
        text: 'text-white',
        senderText: 'text-blue-200',
      };
    case 'private': // Private note - amber
      return {
        bg: 'bg-amber-100',
        text: 'text-gray-700',
        senderText: 'text-amber-700',
      };
    default: // Agent/outgoing message - gray
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        senderText: 'text-blue-600',
      };
  }
};

// Message preview component
const MessagePreview = ({
  message,
  messageVariant,
}: {
  message?: Message;
  messageVariant?: string;
}) => {
  // Safety check - don't render if no message
  if (!message) {
    return null;
  }

  const colors = getPreviewColors(messageVariant);

  // Safe access to attachment info
  const firstAttachment = message.attachments?.[0];
  const fileType = firstAttachment?.fileType || 'file';
  const senderName = message.sender?.name || '';
  const content = message.content || '';

  return (
    <View style={tailwind.style('rounded-2xl overflow-hidden w-full', colors.bg)}>
      <View style={tailwind.style('py-3 px-4')}>
        {senderName ? (
          <Text style={tailwind.style('text-xs font-inter-580-24 mb-1', colors.senderText)}>
            {senderName}
          </Text>
        ) : null}
        {content ? (
          <Text
            style={tailwind.style('text-sm font-inter-420-20 leading-5', colors.text)}
            numberOfLines={2}>
            {truncateText(content, 80)}
          </Text>
        ) : firstAttachment ? (
          <View style={tailwind.style('flex-row items-center')}>
            <View style={tailwind.style('w-4 h-4 mr-2')}>
              <Icon icon={getAttachmentIcon(fileType)} size={16} />
            </View>
            <Text style={tailwind.style('text-sm font-inter-420-20 capitalize', colors.text)}>
              {fileType}
            </Text>
          </View>
        ) : (
          <Text style={tailwind.style('text-sm font-inter-420-20', colors.text)}>Mensagem</Text>
        )}
      </View>
    </View>
  );
};

export const MessageMenu = (props: PropsWithChildren<MessageMenuProps>) => {
  const {
    children,
    menuOptions,
    onEmojiReply,
    showEmojiRow = false,
    message,
    messageVariant,
  } = props;

  const [showMenu, setShowMenu] = useState(false);
  const hapticSelection = useHaptic();

  const triggerHaptic = () => {
    if (hapticSelection) {
      hapticSelection();
    }
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerHaptic)();
      runOnJS(setShowMenu)(true);
    });

  const handleEmojiSelect = (emoji: string) => {
    triggerHaptic();
    setShowMenu(false);
    if (onEmojiReply) {
      onEmojiReply(emoji);
    }
  };

  const handleMenuOption = (handler: () => void) => {
    triggerHaptic();
    setShowMenu(false);
    if (handler) {
      handler();
    }
  };

  const handleClose = () => {
    setShowMenu(false);
  };

  if (menuOptions?.length === 0 && !showEmojiRow) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <React.Fragment>
      <GestureDetector gesture={longPressGesture}>{children}</GestureDetector>

      <Modal visible={showMenu} transparent animationType="none">
        <Pressable
          style={tailwind.style('flex-1 justify-center items-start px-4')}
          onPress={handleClose}>
          {/* Backdrop with blur */}
          <BlurView blurAmount={10} blurType="light" style={tailwind.style('absolute inset-0')} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={tailwind.style('absolute inset-0 bg-blackA-A5')}
          />

          {/* Floating containers */}
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={tailwind.style('items-start gap-3 w-full')}>
            {/* Emoji row container */}
            {showEmojiRow && onEmojiReply && (
              <View style={tailwind.style('rounded-2xl overflow-hidden')}>
                <View
                  style={tailwind.style(
                    'flex-row justify-around items-center py-2.5 px-3 bg-white',
                  )}>
                  {QUICK_EMOJIS.map(emoji => (
                    <Pressable
                      key={emoji}
                      onPress={() => handleEmojiSelect(emoji)}
                      style={({ pressed }) =>
                        tailwind.style(
                          'w-11 h-11 items-center justify-center rounded-full',
                          pressed ? 'bg-blackA-A3' : '',
                        )
                      }>
                      <Text style={tailwind.style('text-[28px]')}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Message preview container */}
            {message && <MessagePreview message={message} messageVariant={messageVariant} />}

            {/* Menu options container */}
            {menuOptions.length > 0 && (
              <View style={tailwind.style('rounded-2xl overflow-hidden min-w-[220px]')}>
                <View style={tailwind.style('bg-white')}>
                  {menuOptions.map((option, index) => (
                    <Pressable
                      key={option.title}
                      onPress={() => handleMenuOption(option.handleOnPressMenuOption)}
                      style={({ pressed }) =>
                        tailwind.style(
                          'flex-row items-center py-3 px-4',
                          pressed ? 'bg-blackA-A3' : '',
                          index !== menuOptions.length - 1 ? 'border-b border-blackA-A3' : '',
                        )
                      }>
                      <View style={tailwind.style('w-6 h-6 mr-3')}>
                        <Icon icon={option.icon} size={24} />
                      </View>
                      <Text
                        style={tailwind.style(
                          'text-base font-inter-420-20',
                          option.destructive ? 'text-red-600' : 'text-gray-900',
                        )}>
                        {option.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </React.Fragment>
  );
};
