import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { TickIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useHaptic } from '@/utils';
import { Icon } from '@/components-next/common';
import { Theme } from '@/types/common/Theme';
import i18n from '@/i18n';

export type ThemeItemType = {
  title: string;
  key: Theme;
};

type ThemeCellProps = {
  item: ThemeItemType;
  index: number;
  currentTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
  isLastItem: boolean;
};

const ThemeCell = (props: ThemeCellProps) => {
  const { item, currentTheme, onChangeTheme, isLastItem } = props;
  const hapticSelection = useHaptic();
  const { colors } = useThemeContext();

  const handlePress = () => {
    hapticSelection?.();
    onChangeTheme(item.key);
  };

  const isSelected = currentTheme === item.key;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={tailwind.style('flex flex-row items-center')}>
        <Animated.View
          style={tailwind.style(
            'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
            !isLastItem && `border-b-[1px] ${colors.borderPrimary}`,
          )}>
          <Animated.Text
            style={tailwind.style(
              `text-base font-inter-420-20 leading-[21px] tracking-[0.16px] ${colors.textPrimary}`,
            )}>
            {item.title}
          </Animated.Text>
          {isSelected && <Icon icon={<TickIcon />} size={20} />}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const ThemeList = ({
  currentTheme,
  onChangeTheme,
}: {
  currentTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
}) => {
  const themesList: ThemeItemType[] = [
    { title: i18n.t('SETTINGS.THEME_OPTIONS.SYSTEM'), key: 'system' },
    { title: i18n.t('SETTINGS.THEME_OPTIONS.LIGHT'), key: 'light' },
    { title: i18n.t('SETTINGS.THEME_OPTIONS.DARK'), key: 'dark' },
  ];

  return (
    <Animated.View style={tailwind.style('pt-1 pb-4 pl-2')}>
      {themesList.map((item, index) => {
        return (
          <ThemeCell
            key={item.key}
            item={item}
            index={index}
            currentTheme={currentTheme}
            onChangeTheme={onChangeTheme}
            isLastItem={index === themesList.length - 1}
          />
        );
      })}
    </Animated.View>
  );
};
