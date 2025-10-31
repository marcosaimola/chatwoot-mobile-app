import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, Switch, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ImageURISource } from 'react-native';

import { tailwind } from '@/theme';
import { fetchAiAgents, updateAgentStatus, type AiAgent } from '@/services/aiAgentsService';
import { Icon } from '@/components-next/common';
import { AiAgentsIcon } from '@/svg-icons/common';
import i18n from '@/i18n';

const AiAgentsScreen = () => {
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
                prevAgents.map(ag =>
                  ag.id === agentId ? { ...ag, ativo: newStatus } : ag
                )
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
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <Animated.View style={[tailwind.style('border-b-[1px] border-b-blackA-A3')]}>
        <Animated.View
          style={[tailwind.style('flex flex-row justify-between items-center px-4 pt-2 pb-[12px]')]}>
          <Animated.View style={tailwind.style('flex-1')} />
          <Animated.View style={tailwind.style('flex-1')}>
            <Animated.Text
              style={tailwind.style(
                'text-[17px] text-center leading-[17px] tracking-[0.32px] font-inter-medium-24 text-gray-950',
              )}>
              {i18n.t('AI_AGENTS.TITLE')}
            </Animated.Text>
          </Animated.View>
          <Animated.View style={tailwind.style('flex-1')} />
        </Animated.View>
      </Animated.View>

      {loading ? (
        <View style={tailwind.style('flex-1 items-center justify-center')}>
          <ActivityIndicator size="large" color={tailwind.color('bg-blue-600')} />
        </View>
      ) : agents.length === 0 ? (
        <View style={tailwind.style('flex-1 items-center justify-center px-4')}>
          <Text style={tailwind.style('text-lg font-inter-medium-24 text-gray-600 text-center')}>
            Nenhum agente de IA disponível
          </Text>
        </View>
      ) : (
        <ScrollView
          style={tailwind.style('flex-1')}
          contentContainerStyle={tailwind.style('py-4 px-4 pb-24')}>
          {agents.map(agent => {
            const imageSource: ImageURISource | null = agent.picture 
              ? { uri: agent.picture }
              : null;

            return (
              <Animated.View
                key={agent.id}
                entering={FadeIn}
                exiting={FadeOut}
                style={tailwind.style(
                  'bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm',
                )}>
                <View style={tailwind.style('flex-row items-center mb-3')}>
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      style={tailwind.style('w-16 h-16 rounded-full mr-3')}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={tailwind.style('w-16 h-16 rounded-full mr-3 bg-gray-200 items-center justify-center')}>
                      <Icon size={32} icon={<AiAgentsIcon stroke={tailwind.color('text-gray-400')} />} />
                    </View>
                  )}
                  <View style={tailwind.style('flex-1')}>
                    <Text
                      style={tailwind.style(
                        'text-lg font-inter-semibold-20 text-gray-900',
                      )}>
                      {agent.nome}
                    </Text>
                  </View>
                  <Switch
                    value={agent.ativo}
                    onValueChange={() => handleToggle(agent)}
                    disabled={updatingIds.has(agent.id)}
                  />
                </View>
                <Text style={tailwind.style('text-sm font-inter-normal-20 text-gray-600')}>
                  {agent.persona}
                </Text>
                {updatingIds.has(agent.id) && (
                  <View style={tailwind.style('mt-2')}>
                    <ActivityIndicator size="small" color={tailwind.color('bg-blue-600')} />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default AiAgentsScreen;
