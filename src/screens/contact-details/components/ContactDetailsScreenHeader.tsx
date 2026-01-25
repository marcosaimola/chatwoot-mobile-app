import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { StackActions, useNavigation } from '@react-navigation/native';

import { Icon, Avatar } from '@/components-next/common';
import { CloseIcon, EditIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';

type ContactDetailsScreenHeaderProps = {
  name: string;
  thumbnail: string;
  bio: string;
  onEditPress?: () => void;
};

export const ContactDetailsScreenHeader = (props: ContactDetailsScreenHeaderProps) => {
  const navigation = useNavigation();
  const { isDark, colors } = useThemeContext();

  const { name, thumbnail, bio, onEditPress } = props;
  const handleBackPress = () => {
    navigation.dispatch(StackActions.pop());
  };

  return (
    <Animated.View
      style={tailwind.style(
        'flex flex-row items-start px-4 py-[13px] border-b-[1px]',
        isDark ? 'border-b-gray-800' : 'border-b-blackA-A3',
      )}>
      <Pressable hitSlop={16} onPress={handleBackPress} style={tailwind.style('flex-1')}>
        <Animated.View>
          <Icon icon={<CloseIcon stroke={isDark ? '#FFFFFF' : undefined} />} size={24} />
        </Animated.View>
      </Pressable>
      <Animated.View>
        <Animated.View style={tailwind.style('flex items-center')}>
          <Avatar size="4xl" src={thumbnail ? { uri: thumbnail } : undefined} name={name} />
          <Animated.View style={tailwind.style('flex flex-col items-center gap-1 pt-3')}>
            <Animated.Text
              style={tailwind.style(
                'text-[21px] font-inter-580-24',
                isDark ? 'text-gray-100' : 'text-gray-950',
              )}>
              {name}
            </Animated.Text>
            {bio ? (
              <Animated.Text
                style={tailwind.style(
                  'text-[15px] font-inter-420-20 leading-[17.25px]',
                  isDark ? 'text-gray-400' : 'text-gray-900',
                )}>
                {bio}
              </Animated.Text>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={tailwind.style('flex-1 items-end')}>
        {onEditPress ? (
          <Pressable hitSlop={16} onPress={onEditPress}>
            <Icon icon={<EditIcon stroke={isDark ? '#60A5FA' : '#2563EB'} />} size={24} />
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
