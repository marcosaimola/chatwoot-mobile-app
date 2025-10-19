import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { Icon } from '@/components-next';
import { KanbanItem } from '../types/KanbanTypes';
import { Clear, Trash } from '@/svg-icons/common';
import i18n from '@/i18n';

interface KanbanItemDisplayProps {
  item: KanbanItem;
  onEdit: () => void;
  onDelete: () => void;
}

export const KanbanItemDisplay: React.FC<KanbanItemDisplayProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  return (
    <Animated.View style={tailwind.style('p-4')}>
      <Animated.View style={tailwind.style('flex-row items-center justify-between mb-4')}>
        <Animated.Text style={tailwind.style('text-base font-inter-420-20 leading-[22px] tracking-[0.16px] text-gray-950')}>
          {item.funnel_name || i18n.t('KANBAN.DISPLAY.FUNNEL_NOT_DEFINED')} - {item.stage_name || i18n.t('KANBAN.DISPLAY.STAGE_NOT_DEFINED')}
        </Animated.Text>
        
        {item.value !== null && item.value !== undefined && item.value > 0 && (
          <Animated.View style={tailwind.style('bg-green-100 px-2 py-1 rounded-full')}>
            <Animated.Text style={tailwind.style('text-green-800 text-xs font-inter-medium-24')}>
              R$ {item.value.toLocaleString('pt-BR')}
            </Animated.Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View style={tailwind.style('flex-row justify-end mt-4')}>
        <Pressable
          onPress={onEdit}
          style={tailwind.style('px-3 py-2 bg-blue-50 rounded-lg mr-2')}>
          <Animated.Text style={tailwind.style('text-blue-600 font-inter-medium-24')}>
            {i18n.t('KANBAN.DISPLAY.EDIT')}
          </Animated.Text>
        </Pressable>
        
        <Pressable
          onPress={onDelete}
          style={tailwind.style('px-3 py-2 bg-red-50 rounded-lg')}>
          <Animated.Text style={tailwind.style('text-red-600 font-inter-medium-24')}>
            {i18n.t('KANBAN.DISPLAY.REMOVE')}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};
