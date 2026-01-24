import React from 'react';
import { Text } from 'react-native';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { NativeView } from '@/components-next/native-components';

type ConversationIdProps = {
  id: number;
};

export const ConversationId = (props: ConversationIdProps) => {
  const { id } = props;
  const { colors } = useThemeContext();
  return (
    <NativeView style={tailwind.style('flex flex-row items-center gap-0.5')}>
      <Text style={tailwind.style(`text-sm font-inter-420-20 ${colors.textSecondary}`)}>#</Text>
      <Text style={tailwind.style(`text-sm font-inter-420-20 ${colors.textSecondary}`)}>{id}</Text>
    </NativeView>
  );
};

ConversationId.displayName = 'ConversationId';
