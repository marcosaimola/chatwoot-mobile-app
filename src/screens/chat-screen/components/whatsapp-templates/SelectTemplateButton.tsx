import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { Icon } from '@/components-next/common';
import { useThemeContext } from '@/context';
import { FileIcon } from '@/svg-icons';
import i18n from '@/i18n';

interface SelectTemplateButtonProps {
  onPress: () => void;
}

export const SelectTemplateButton = ({ onPress }: SelectTemplateButtonProps) => {
  const { isDark } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tailwind.style(
          'flex-row items-center justify-center py-3 px-6 rounded-xl mx-3 my-2',
          isDark ? 'bg-blue-800' : 'bg-blue-700',
          pressed && (isDark ? 'bg-blue-900' : 'bg-blue-800'),
        ),
      ]}>
      <Icon icon={<FileIcon fill="white" />} size={20} />
      <Animated.Text
        style={tailwind.style(
          'text-white font-inter-medium-24 text-md ml-2',
        )}>
        {i18n.t('WHATSAPP_TEMPLATES.SELECT_TEMPLATE')}
      </Animated.Text>
    </Pressable>
  );
};
