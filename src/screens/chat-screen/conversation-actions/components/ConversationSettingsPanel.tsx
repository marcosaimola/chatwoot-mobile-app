import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Agent, ConversationPriority, Team } from '@/types';
import AssigneePanel from './AssigneePanel';
import TeamPanel from './TeamPanel';
import PriorityPanel from './PriorityPanel';

type ConversationSettingsPanelProps = {
  priority: ConversationPriority;
  team: Team | null;
  assignee: Agent | null;
  onChangeAssignee: () => void;
  onChangeTeamAssignee: () => void;
  onChangePriority: () => void;
};

export const ConversationSettingsPanel = ({
  assignee,
  team,
  priority,
  onChangeAssignee,
  onChangeTeamAssignee,
  onChangePriority,
}: ConversationSettingsPanelProps) => {
  const { isDark } = useThemeContext();

  return (
    <Animated.View style={[tailwind.style(`rounded-[13px] mx-4 ${isDark ? 'bg-gray-950' : 'bg-white'}`), isDark ? styles.listShadowDark : styles.listShadow]}>
      <AssigneePanel assignee={assignee} onPress={onChangeAssignee} />
      <TeamPanel team={team} onPress={onChangeTeamAssignee} />
      <PriorityPanel priority={priority} onPress={onChangePriority} />
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
