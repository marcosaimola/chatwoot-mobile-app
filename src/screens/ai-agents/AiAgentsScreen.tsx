import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Switch,
  StatusBar,
  ImageURISource,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { fetchAiAgents, updateAgentStatus, type AiAgent } from '@/services/aiAgentsService';
import { Avatar } from '@/components-next/common';
import i18n from '@/i18n';
import { TAB_BAR_HEIGHT } from '@/constants';

const AiAgentsScreen = () => {
  const { colors, isDark } = useThemeContext();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await fetchAiAgents();
      setAgents(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os agentes de IA.');
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (agent: AiAgent) => {
    const newStatus = !agent.ativo;
    const agentId = agent.id;

    // Show confirmation dialog
    Alert.alert(
      newStatus ? 'Ativar Agente de IA' : 'Desativar Agente de IA',
      newStatus
        ? 'Ao continuar, o agente de IA passará a atender os contatos.'
        : 'Ao continuar, o agente de IA deixará de atender os contatos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Continuar',
          style: 'default',
          onPress: async () => {
            // Add to updating set
            setUpdatingIds(prev => new Set(prev).add(agentId));

            try {
              await updateAgentStatus({ id: agentId, ativo: newStatus });

              // Update local state
              setAgents(prevAgents =>
                prevAgents.map(ag => (ag.id === agentId ? { ...ag, ativo: newStatus } : ag)),
              );
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível atualizar o status do agente.');
              console.error('Error updating agent:', error);
            } finally {
              // Remove from updating set
              setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(agentId);
                return newSet;
              });
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={tailwind.style(`flex-1 ${colors.bgPrimary}`)}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color(colors.statusBarBg)}
        barStyle={colors.statusBarStyle}
      />
      {/* Header */}
      <Animated.View style={[tailwind.style(`border-b-[1px] ${colors.borderPrimary}`)]}>
        <Animated.View
          style={[
            tailwind.style('flex flex-row justify-between items-center px-4 pt-2 pb-[12px]'),
          ]}>
          <Animated.View style={tailwind.style('flex-1')} />
          <Animated.View style={tailwind.style('flex-1')}>
            <Animated.Text
              style={tailwind.style(
                `text-[17px] text-center leading-[17px] tracking-[0.32px] font-inter-medium-24 ${colors.textPrimary}`,
              )}>
              {i18n.t('AI_AGENTS.TITLE')}
            </Animated.Text>
          </Animated.View>
          <Animated.View style={tailwind.style('flex-1')} />
        </Animated.View>
      </Animated.View>

      {loading ? (
        <Animated.View
          style={tailwind.style('flex-1 items-center justify-center', `pb-[${TAB_BAR_HEIGHT}px]`)}>
          <ActivityIndicator color={isDark ? '#FFFFFF' : undefined} />
        </Animated.View>
      ) : agents.length === 0 ? (
        <Animated.View
          style={tailwind.style(
            'flex-1 items-center justify-center px-4',
            `pb-[${TAB_BAR_HEIGHT}px]`,
          )}>
          <Animated.Text
            style={tailwind.style(`pt-6 text-md tracking-[0.32px] ${colors.textSecondary}`)}>
            {i18n.t('AI_AGENTS.EMPTY')}
          </Animated.Text>
        </Animated.View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT}px]`)}>
          {/* Agents List */}
          {agents.map((agent, index) => {
            const imageSource: ImageURISource = agent.picture
              ? { uri: agent.picture }
              : { uri: '' };
            const isLastItem = index === agents.length - 1;

            return (
              <Animated.View
                key={agent.id}
                entering={FadeIn}
                exiting={FadeOut}
                style={tailwind.style('px-3 gap-3 flex-row justify-between')}>
                {/* Avatar */}
                <Animated.View style={tailwind.style('py-3 flex flex-row')}>
                  <Avatar size="4xl" src={imageSource} name={agent.nome || ''} status="offline" />
                </Animated.View>

                {/* Content */}
                <Animated.View
                  style={tailwind.style(
                    'flex-1 flex-row items-center justify-between py-3',
                    !isLastItem ? `border-b-[1px] ${colors.borderPrimary}` : '',
                  )}>
                  <Animated.View style={tailwind.style('flex-1 gap-1')}>
                    <Animated.Text
                      numberOfLines={1}
                      style={tailwind.style(
                        `text-base font-inter-medium-24 tracking-[0.24px] ${colors.textPrimary}`,
                      )}>
                      {agent.nome}
                    </Animated.Text>
                    {agent.persona ? (
                      <Animated.Text
                        numberOfLines={1}
                        style={tailwind.style(
                          `text-sm font-inter-normal-20 tracking-[0.24px] ${colors.textSecondary}`,
                        )}>
                        {agent.persona}
                      </Animated.Text>
                    ) : null}
                  </Animated.View>

                  {/* Switch */}
                  <Animated.View style={tailwind.style('flex-row items-center')}>
                    {updatingIds.has(agent.id) ? (
                      <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : undefined} />
                    ) : (
                      <Switch
                        trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                        thumbColor={colors.switchThumb}
                        style={styles.switch}
                        ios_backgroundColor={colors.switchTrackOff}
                        value={agent.ativo}
                        onValueChange={() => handleToggle(agent)}
                        disabled={updatingIds.has(agent.id)}
                      />
                    )}
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  switch: {
    transform: [{ scale: 0.8 }],
  },
});

export default AiAgentsScreen;
