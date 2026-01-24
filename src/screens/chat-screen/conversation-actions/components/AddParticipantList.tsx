import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { AddParticipant, Overflow } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Avatar, Icon } from '@/components-next';
import { Agent } from '@/types';
import i18n from '@/i18n';

type ListItemProps = {
  listItem: Agent;
  index: number;
};

const ListItem = (props: ListItemProps) => {
  const { listItem, index } = props;
  const { colors, isDark } = useThemeContext();
  return (
    <Pressable
      key={index}
      style={({ pressed }) => [
        tailwind.style(pressed ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : '', index === 0 ? 'rounded-t-[13px]' : ''),
      ]}>
      <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
        <Animated.View>
          <Avatar src={{ uri: listItem.thumbnail || undefined }} size="lg" />
        </Animated.View>
        <Animated.View
          style={tailwind.style(`flex-1 py-[11px] ml-2 border-b-[1px] ${colors.borderPrimary}`)}>
          <Animated.Text
            style={tailwind.style(
              `text-base font-inter-420-20 leading-[22px] tracking-[0.16px] ${colors.textPrimary}`,
            )}>
            {listItem.name}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const ParticipantOverflowCell = ({ count }: { count: number }) => {
  const { colors, isDark } = useThemeContext();
  return (
    <Pressable style={({ pressed }) => [tailwind.style(pressed ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : '')]}>
      <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
        <Animated.View>
          <Icon icon={<Overflow stroke={isDark ? '#9CA3AF' : tailwind.color('text-gray-600')} />} size={28} />
        </Animated.View>
        <Animated.View
          style={tailwind.style(`flex-1 py-[11px] ml-2 border-b-[1px] ${colors.borderPrimary}`)}>
          <Animated.Text
            style={tailwind.style(
              `text-base font-inter-420-20 leading-[22px] tracking-[0.16px] ${colors.textPrimary}`,
            )}>
            {count} participants
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

type AddParticipantListProps = {
  conversationParticipants: Agent[];
  onAddParticipant: () => void;
};

export const AddParticipantList = (props: AddParticipantListProps) => {
  const { conversationParticipants, onAddParticipant } = props;
  const { colors, isDark } = useThemeContext();

  const overflowCount = conversationParticipants?.length;
  return (
    <Animated.View>
      <Animated.View style={tailwind.style('pl-4 pb-3')}>
        <Animated.Text
          style={tailwind.style(
            `text-sm font-inter-medium-24 tracking-[0.32px] leading-[16px] ${colors.textSecondary}`,
          )}>
          {i18n.t('CONVERSATION_PARTICIPANTS.TITLE')}
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[tailwind.style(`rounded-[13px] mx-4 ${isDark ? 'bg-gray-950' : 'bg-white'}`), isDark ? styles.listShadowDark : styles.listShadow]}>
        {conversationParticipants &&
          conversationParticipants.slice(0, 4).map((listItem, index) => {
            return <ListItem key={index} {...{ listItem, index }} />;
          })}
        {overflowCount > 4 && <ParticipantOverflowCell count={overflowCount - 4} />}
        <Pressable
          onPress={onAddParticipant}
          style={({ pressed }) => [
            tailwind.style('rounded-b-[13px]', pressed ? (isDark ? 'bg-blue-900/30' : 'bg-blue-100') : ''),
          ]}>
          <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
            <Animated.View style={tailwind.style('p-0.5')}>
              <Icon icon={<AddParticipant stroke={isDark ? '#60A5FA' : tailwind.color('text-blue-800')} />} size={24} />
            </Animated.View>
            <Animated.View style={tailwind.style('flex-1 py-[11px] ml-2')}>
              <Animated.Text
                style={tailwind.style(
                  `text-base font-inter-420-20 leading-[22px] tracking-[0.16px] ${isDark ? 'text-blue-400' : 'text-blue-800'}`,
                )}>
                {i18n.t('CONVERSATION_PARTICIPANTS.ADD_PARTICIPANT')}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listShadow:
    Platform.select({
      ios: {
        shadowColor: '#00000040',
        shadowOffset: { width: 0, height: 0.15 },
        shadowRadius: 2,
        shadowOpacity: 0.35,
        elevation: 2,
      },
      android: {
        elevation: 4,
        backgroundColor: 'white',
      },
    }) || {},
  listShadowDark:
    Platform.select({
      ios: {
        shadowColor: '#00000080',
        shadowOffset: { width: 0, height: 0.15 },
        shadowRadius: 2,
        shadowOpacity: 0.5,
        elevation: 2,
      },
      android: {
        elevation: 4,
        backgroundColor: '#030712',
      },
    }) || {},
});
