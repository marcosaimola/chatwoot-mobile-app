import React, { useEffect, useState, memo, useCallback } from 'react';
import { Pressable, ActivityIndicator, Platform, StyleSheet, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { webhookService } from '@/services/WebhookService';
import { showToast } from '@/utils/toastUtils';
import { KanbanItem, KanbanFunnel } from '../types/KanbanTypes';
import { KanbanItemDisplay } from './KanbanItemDisplay';
import { useAppSelector } from '@/hooks';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import i18n from '@/i18n';
import { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';

interface KanbanItemCardProps {
  conversationId: number;
}

type NavigationProp = NativeStackNavigationProp<TabBarExcludedScreenParamList>;

const KanbanItemCardComponent: React.FC<KanbanItemCardProps> = ({ conversationId }) => {
  const [kanbanItem, setKanbanItem] = useState<KanbanItem | null>(null);
  const [availableFunnels, setAvailableFunnels] = useState<KanbanFunnel[]>([]);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeContext();
  const navigation = useNavigation<NavigationProp>();

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const contactName = conversation?.meta?.sender?.name || '';

  // Reload data when screen comes back into focus (after form submit)
  useFocusEffect(
    useCallback(() => {
      if (conversationId && conversationId > 0) {
        loadKanbanData();
      }
    }, [conversationId]),
  );

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const itemResponse = await webhookService.get('kanban/item-per-mobile-conversation', conversationId);
      const itemData = itemResponse.data;
      
      if (itemData && itemData.length > 0 && itemData[0].id && itemData[0].id !== '') {
        setKanbanItem(itemData[0]);
      } else {
        setKanbanItem(null);
        loadAvailableFunnels();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do kanban:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFunnels = async (): Promise<KanbanFunnel[]> => {
    try {
      const funnelsResponse = await webhookService.get('kanban/mobile-list');
      const funnels = funnelsResponse.data || [];
      setAvailableFunnels(funnels);
      return funnels;
    } catch (error) {
      console.error('Erro ao carregar funis disponíveis:', error);
      return [];
    }
  };

  const handleAddItem = async () => {
    const funnels = await loadAvailableFunnels();
    if (funnels.length === 0) {
      showToast({ message: i18n.t('KANBAN.MESSAGES.NO_FUNNELS_ADD') });
      return;
    }
    navigation.navigate('KanbanItemFormScreen', {
      conversationId,
      item: null,
      funnels,
      contactName,
    });
  };

  const handleEditItem = async () => {
    const funnels = await loadAvailableFunnels();
    if (funnels.length === 0) {
      showToast({ message: i18n.t('KANBAN.MESSAGES.NO_FUNNELS_EDIT') });
      return;
    }
    navigation.navigate('KanbanItemFormScreen', {
      conversationId,
      item: kanbanItem,
      funnels,
      contactName,
    });
  };

  const handleDeleteItem = async () => {
    if (!kanbanItem) return;
    
    Alert.alert(
      i18n.t('KANBAN.CONFIRMATION.DELETE_TITLE'),
      i18n.t('KANBAN.CONFIRMATION.DELETE_MESSAGE'),
      [
        {
          text: i18n.t('KANBAN.CONFIRMATION.CANCEL'),
          style: 'cancel',
        },
        {
          text: i18n.t('KANBAN.CONFIRMATION.REMOVE'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await webhookService.delete(`kanban/delete-mobile?id=${kanbanItem.id}`);
              
              if (response.data && response.data.success === true) {
                showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_DELETED') });
                setKanbanItem(null);
                loadAvailableFunnels();
              } else {
                showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_DELETE_ERROR') });
              }
            } catch (error) {
              console.error('Erro ao deletar item:', error);
              showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_DELETE_ERROR') });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Animated.View style={tailwind.style('px-4')}>
        <Animated.View style={tailwind.style(`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`)}>
          <ActivityIndicator size="small" color={tailwind.color('blue-600')} />
          <Animated.Text style={tailwind.style(`text-center mt-2 ${colors.textSecondary}`)}>
            {i18n.t('KANBAN.MESSAGES.LOADING')}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View>
      <Animated.View style={tailwind.style('pl-4 pb-3')}>
        <Animated.Text
          style={tailwind.style(
            `text-sm font-inter-medium-24 tracking-[0.32px] leading-[16px] ${colors.textSecondary}`,
          )}>
          {i18n.t('KANBAN.TITLE')}
        </Animated.Text>
      </Animated.View>
      
      <Animated.View style={[tailwind.style(`rounded-[13px] mx-4 ${isDark ? 'bg-gray-950' : 'bg-white'}`), isDark ? styles.listShadowDark : styles.listShadow]}>
        {kanbanItem ? (
          <KanbanItemDisplay
            item={kanbanItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        ) : (
          <Animated.View style={tailwind.style('p-4')}>
            <Animated.Text style={tailwind.style(`mb-4 ${colors.textSecondary}`)}>
              {i18n.t('KANBAN.NO_ITEM')}
            </Animated.Text>
            {availableFunnels.length > 0 && (
              <Pressable
                onPress={handleAddItem}
                style={tailwind.style(`flex-row items-center justify-center rounded-lg p-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`)}>
                <Animated.Text style={tailwind.style(`font-inter-medium-24 ${isDark ? 'text-blue-400' : 'text-blue-600'}`)}>
                  {i18n.t('KANBAN.ADD_ITEM')}
                </Animated.Text>
              </Pressable>
            )}
          </Animated.View>
        )}
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

export const KanbanItemCard = memo(KanbanItemCardComponent);
