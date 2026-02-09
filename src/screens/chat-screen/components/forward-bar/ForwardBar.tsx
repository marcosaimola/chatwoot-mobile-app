import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { tailwind } from '@/theme';
import { ShareIcon } from '@/svg-icons';
import {
  selectSelectedMessagesCount,
  exitForwardMode,
} from '@/store/conversation/forwardMessageSlice';
import i18n from '@/i18n';
import { useHaptic } from '@/utils';

interface ForwardBarProps {
  onSharePress: () => void;
}

export const ForwardBar = ({ onSharePress }: ForwardBarProps) => {
  const dispatch = useAppDispatch();
  const { isDark } = useThemeContext();
  const { bottom } = useSafeAreaInsets();
  const hapticSelection = useHaptic();

  const selectedCount = useAppSelector(selectSelectedMessagesCount);

  const handleCancel = () => {
    hapticSelection?.();
    dispatch(exitForwardMode());
  };

  const handleShare = () => {
    hapticSelection?.();
    onSharePress();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[
        tailwind.style(
          `flex-row items-center justify-between px-4 py-3 border-t`,
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        ),
        { paddingBottom: Math.max(bottom, 12) },
      ]}>
      {/* Share Button */}
      <Pressable
        onPress={handleShare}
        disabled={selectedCount === 0}
        style={({ pressed }) =>
          tailwind.style(
            'w-10 h-10 items-center justify-center rounded-full',
            pressed ? 'bg-blackA-A3' : '',
            selectedCount === 0 ? 'opacity-40' : '',
          )
        }>
        <ShareIcon stroke={isDark ? '#FFFFFF' : '#3B82F6'} />
      </Pressable>

      {/* Selection Counter */}
      <View style={tailwind.style('flex-1 items-center')}>
        <Text
          style={tailwind.style(
            'text-base font-inter-medium-24',
            isDark ? 'text-white' : 'text-gray-900',
          )}>
          {i18n.t('FORWARD.SELECTED_COUNT', { count: selectedCount })}
        </Text>
      </View>

      {/* Cancel Button */}
      <Pressable
        onPress={handleCancel}
        style={({ pressed }) =>
          tailwind.style(
            'px-3 py-2 rounded-lg',
            pressed ? 'bg-blackA-A3' : '',
          )
        }>
        <Text
          style={tailwind.style(
            'text-base font-inter-medium-24',
            isDark ? 'text-blue-400' : 'text-blue-600',
          )}>
          {i18n.t('FORWARD.CANCEL')}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default ForwardBar;
