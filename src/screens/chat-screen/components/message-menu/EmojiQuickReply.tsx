import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useHaptic } from '@/utils';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏'];

type EmojiQuickReplyProps = {
  onEmojiSelect: (emoji: string) => void;
};

export const EmojiQuickReply = ({ onEmojiSelect }: EmojiQuickReplyProps) => {
  const hapticSelection = useHaptic();

  const handleEmojiPress = (emoji: string) => {
    hapticSelection?.();
    onEmojiSelect(emoji);
  };

  return (
    <Animated.View
      style={tailwind.style(
        'flex-row justify-around items-center py-3 px-4 border-b border-blackA-A3',
      )}>
      {QUICK_EMOJIS.map(emoji => (
        <Pressable
          key={emoji}
          onPress={() => handleEmojiPress(emoji)}
          style={({ pressed }) =>
            tailwind.style(
              'w-10 h-10 items-center justify-center rounded-full',
              pressed ? 'bg-blackA-A3' : '',
            )
          }>
          <Text style={tailwind.style('text-[28px]')}>{emoji}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
};
