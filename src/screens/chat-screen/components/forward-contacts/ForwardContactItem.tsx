import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { tailwind } from '@/theme';
import { Contact } from '@/types';
import { Avatar } from '@/components-next/common';
import {
  toggleContactSelection,
  selectIsContactSelected,
} from '@/store/conversation/forwardMessageSlice';
import { useHaptic } from '@/utils';
import { CheckedIcon, UncheckedIcon } from '@/svg-icons';

interface ForwardContactItemProps {
  contact: Contact;
}

const ForwardContactItemComponent = ({ contact }: ForwardContactItemProps) => {
  const dispatch = useAppDispatch();
  const { isDark } = useThemeContext();
  const hapticSelection = useHaptic();

  const isSelected = useAppSelector(state => selectIsContactSelected(state, contact.id));

  const displayName = contact.name || contact.email || contact.phoneNumber || 'Sem nome';
  const subtitle = contact.phoneNumber || contact.email || '';

  const handlePress = useCallback(() => {
    hapticSelection?.();
    dispatch(toggleContactSelection(contact));
  }, [hapticSelection, dispatch, contact]);

  if (!contact || !contact.id) {
    return null;
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) =>
        tailwind.style(
          'flex-row items-center px-4 py-3',
          pressed ? (isDark ? 'bg-gray-800' : 'bg-gray-50') : '',
          isDark ? 'border-gray-800' : 'border-gray-100',
          'border-b',
        )
      }>
      {/* Avatar */}
      <Avatar
        size="md"
        name={displayName}
        src={contact.thumbnail ? { uri: contact.thumbnail } : undefined}
      />

      {/* Contact Info */}
      <View style={tailwind.style('flex-1 ml-3')}>
        <Text
          style={tailwind.style(
            'text-base font-inter-medium-24',
            isDark ? 'text-white' : 'text-gray-900',
          )}
          numberOfLines={1}>
          {displayName}
        </Text>
        {subtitle ? (
          <Text
            style={tailwind.style(
              'text-sm font-inter-normal-20 mt-0.5',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Checkbox */}
      <View style={tailwind.style('w-6 h-6 ml-3')}>
        {isSelected ? (
          <CheckedIcon />
        ) : (
          <UncheckedIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />
        )}
      </View>
    </Pressable>
  );
};

// Memoize to prevent unnecessary re-renders
export const ForwardContactItem = memo(ForwardContactItemComponent);

export default ForwardContactItem;
