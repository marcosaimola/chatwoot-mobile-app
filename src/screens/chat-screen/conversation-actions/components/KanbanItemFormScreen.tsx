import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { KanbanItemForm } from './KanbanItemForm';
import { KanbanItem, KanbanFunnel } from '../types/KanbanTypes';

export interface KanbanItemFormScreenParams {
  conversationId: number;
  item?: KanbanItem | null;
  funnels: KanbanFunnel[];
  contactName?: string;
}

type KanbanItemFormScreenRouteProp = RouteProp<
  { KanbanItemFormScreen: KanbanItemFormScreenParams },
  'KanbanItemFormScreen'
>;

export const KanbanItemFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<KanbanItemFormScreenRouteProp>();
  const { colors } = useThemeContext();

  const { conversationId, item, funnels, contactName } = route.params;

  const handleSubmit = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={tailwind.style(`flex-1 ${colors.bgPrimary}`)}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={tailwind.style('flex-1')}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <ScrollView
          style={tailwind.style('flex-1')}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={tailwind.style('pb-8')}>
          <KanbanItemForm
            conversationId={conversationId}
            item={item}
            funnels={funnels}
            contactName={contactName}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default KanbanItemFormScreen;
