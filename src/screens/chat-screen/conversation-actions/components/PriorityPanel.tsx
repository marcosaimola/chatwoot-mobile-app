import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components-next';
import { CaretRight, PriorityIcon, NoPriorityIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { ConversationPriority } from '@/types';
import i18n from '@/i18n';

type PriorityPanelProps = {
  priority: ConversationPriority;
  onPress: () => void;
};

const PriorityPanel = ({ priority, onPress }: PriorityPanelProps) => {
  const { colors, isDark } = useThemeContext();
  const priorityName = priority ? priority : i18n.t('CONVERSATION.ACTIONS.PRIORITY.EMPTY');

  const priorityAvatar = () => {
    if (priority) {
      return <Icon icon={<PriorityIcon stroke={isDark ? '#9CA3AF' : undefined} />} />;
    }
    return <Icon icon={<NoPriorityIcon stroke={isDark ? '#9CA3AF' : undefined} />} />;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [tailwind.style(pressed ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : '', 'rounded-b-[13px]')]}>
      <Animated.View style={tailwind.style('flex-row items-center justify-between pl-3')}>
        {priorityAvatar()}
        <Animated.View
          style={tailwind.style(
            'flex-1 flex-row items-center justify-between py-[11px] ml-[10px]',
          )}>
          <Animated.Text
            style={tailwind.style(
              `text-base font-inter-420-20 leading-[22.4px] tracking-[0.16px] capitalize ${colors.textPrimary}`,
            )}>
            {priorityName}
          </Animated.Text>
          <Animated.View style={tailwind.style('flex-row items-center pr-3')}>
            <Animated.Text
              style={tailwind.style(
                `text-base font-inter-normal-20 leading-[22px] tracking-[0.16px] ${colors.textSecondary}`,
              )}>
              {i18n.t('CONVERSATION.ACTIONS.PRIORITY.EDIT')}
            </Animated.Text>
            <Icon icon={<CaretRight stroke={isDark ? '#9CA3AF' : undefined} />} size={20} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export default PriorityPanel;
