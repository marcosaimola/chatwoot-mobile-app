import React, { useState, useEffect } from 'react';
import { Pressable, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { Button } from '@/components-next';
import { KanbanItem, KanbanFunnel, KanbanItemFormData } from '../types/KanbanTypes';
import { showToast } from '@/utils/toastUtils';
import { Dropdown } from './Dropdown';
import { webhookService } from '@/services/WebhookService';
import { useAppSelector } from '@/hooks';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import i18n from '@/i18n';

interface KanbanItemFormProps {
  conversationId: number;
  item?: KanbanItem | null;
  funnels: KanbanFunnel[];
  contactName?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const KanbanItemForm: React.FC<KanbanItemFormProps> = ({
  conversationId,
  item,
  funnels,
  contactName,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(item?.title || contactName || '');
  const [description, setDescription] = useState(item?.description || '');
  const [value, setValue] = useState(item?.value?.toString() || '0');
  const [loading, setLoading] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<KanbanFunnel | null>(null);
  const [selectedStage, setSelectedStage] = useState<any>(null);

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  useEffect(() => {
    if (item) {
      // Preencher com dados do item existente
      setTitle(item.title);
      const funnel = funnels.find(f => f.funnel_id === item.funnel_id);
      const stage = funnel?.stages.find(s => s.stage_id === item.stage_id);
      setSelectedFunnel(funnel || null);
      setSelectedStage(stage || null);
    } else {
      // Preencher com primeiro funil disponível
      if (funnels.length > 0) {
        const firstFunnel = funnels[0];
        setSelectedFunnel(firstFunnel);
        setSelectedStage(firstFunnel.stages[0] || null);
      }
    }
  }, [item, funnels, contactName]);

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit chamado');
    
    if (!title || !selectedFunnel || !selectedStage) {
      showToast({ message: i18n.t('KANBAN.MESSAGES.REQUIRED_FIELDS') });
      return;
    }

    if (loading) {
      console.log('⚠️ Já está carregando, ignorando chamada duplicada');
      return;
    }

    // Proteção adicional contra múltiplas execuções
    if (Date.now() - (handleSubmit as any).lastExecution < 1000) {
      console.log('⚠️ Execução muito rápida, ignorando');
      return;
    }
    (handleSubmit as any).lastExecution = Date.now();

    try {
      setLoading(true);
      console.log('🔄 Iniciando criação do item...');
      
      // Usar dados da conversa atual para criar o item
      let contactId = 0;
      let contactPhoneNumber = '';
      
      if (conversation?.meta?.sender) {
        contactId = conversation.meta.sender.id || 0;
        contactPhoneNumber = conversation.meta.sender.phone_number || '';
        console.log('📱 Usando dados da conversa - ID:', contactId, 'Phone:', contactPhoneNumber);
      } else {
        console.log('⚠️ Dados do contato não encontrados na conversa');
        showToast({ message: i18n.t('KANBAN.MESSAGES.CONTACT_NOT_FOUND') });
        return;
      }

      const formData = {
        funnel_id: selectedFunnel.funnel_id,
        stage_id: selectedStage.stage_id,
        title,
        description,
        value: parseFloat(value) || 0,
        priority: 'medium',
        conversation_id: conversationId,
        contact: {
          id: contactId,
          phone_number: contactPhoneNumber,
        },
      };

      console.log('📤 Enviando dados:', formData);

      if (item) {
        // Edit existing item
        console.log('✏️ Editando item existente');
        await webhookService.post('kanban/mobile-salvar', {
          ...formData,
          id: item.id,
        });
        showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_UPDATED') });
      } else {
        // Create new item
        console.log('➕ Criando novo item');
        await webhookService.post('kanban/mobile-salvar', formData);
        showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_CREATED') });
      }
      
      console.log('✅ Item salvo com sucesso');
      // Chamar onSubmit apenas para fechar o modal e atualizar a lista
      onSubmit();
    } catch (error) {
      console.error('❌ Erro ao salvar item:', error);
      showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_SAVE_ERROR') });
    } finally {
      setLoading(false);
      console.log('🏁 Finalizando handleSubmit');
    }
  };

  return (
    <Animated.View style={tailwind.style('flex-1')}>
      <Animated.View style={tailwind.style('flex-row justify-between items-center mb-6 px-4')}>
        <Animated.Text style={tailwind.style('text-xl font-inter-medium-24 text-gray-900')}>
          {item ? i18n.t('KANBAN.EDIT_ITEM') : i18n.t('KANBAN.ADD_ITEM')}
        </Animated.Text>
        <Pressable onPress={onCancel}>
          <Animated.Text style={tailwind.style('text-blue-600 font-inter-medium-24')}>
            ✕
          </Animated.Text>
        </Pressable>
      </Animated.View>

      <Animated.ScrollView style={tailwind.style('flex-1 px-4')} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <Animated.View style={tailwind.style('mb-4')}>
          <Animated.Text style={tailwind.style('text-sm font-inter-medium-24 text-gray-700 mb-2')}>
            {i18n.t('KANBAN.FORM.TITLE')} *
          </Animated.Text>
          <TextInput
            style={tailwind.style('border border-gray-300 rounded-lg px-3 py-2 text-base')}
            value={title}
            onChangeText={setTitle}
            placeholder={i18n.t('KANBAN.FORM.TITLE_PLACEHOLDER')}
          />
        </Animated.View>

        {/* Descrição */}
        <Animated.View style={tailwind.style('mb-4')}>
          <Animated.Text style={tailwind.style('text-sm font-inter-medium-24 text-gray-700 mb-2')}>
            {i18n.t('KANBAN.FORM.DESCRIPTION')}
          </Animated.Text>
          <TextInput
            style={tailwind.style('border border-gray-300 rounded-lg px-3 py-2 text-base h-20')}
            value={description}
            onChangeText={setDescription}
            placeholder={i18n.t('KANBAN.FORM.DESCRIPTION_PLACEHOLDER')}
            multiline
          />
        </Animated.View>

        {/* Funil */}
        <Dropdown
          label={`${i18n.t('KANBAN.FORM.FUNNEL')} *`}
          options={funnels.map(funnel => ({ id: funnel.funnel_id, name: funnel.funnel_name }))}
          selectedOption={selectedFunnel ? { id: selectedFunnel.funnel_id, name: selectedFunnel.funnel_name } : null}
          onSelect={(option) => {
            const funnel = funnels.find(f => f.funnel_id === option.id);
            if (funnel) {
              setSelectedFunnel(funnel);
              setSelectedStage(funnel.stages[0] || null);
            }
          }}
          placeholder={i18n.t('KANBAN.FORM.FUNNEL_PLACEHOLDER')}
        />

        {/* Estágio */}
        {selectedFunnel && (
          <Dropdown
            label={`${i18n.t('KANBAN.FORM.STAGE')} *`}
            options={selectedFunnel.stages.map(stage => ({ id: stage.stage_id, name: stage.stage_name }))}
            selectedOption={selectedStage ? { id: selectedStage.stage_id, name: selectedStage.stage_name } : null}
            onSelect={(option) => {
              const stage = selectedFunnel.stages.find(s => s.stage_id === option.id);
              if (stage) {
                setSelectedStage(stage);
              }
            }}
            placeholder={i18n.t('KANBAN.FORM.STAGE_PLACEHOLDER')}
          />
        )}

        {/* Valor */}
        <Animated.View style={tailwind.style('mb-6')}>
          <Animated.Text style={tailwind.style('text-sm font-inter-medium-24 text-gray-700 mb-2')}>
            {i18n.t('KANBAN.FORM.VALUE')}
          </Animated.Text>
          <TextInput
            style={tailwind.style('border border-gray-300 rounded-lg px-3 py-2 text-base')}
            value={value}
            onChangeText={setValue}
            placeholder={i18n.t('KANBAN.FORM.VALUE_PLACEHOLDER')}
            keyboardType="numeric"
          />
        </Animated.View>
      </Animated.ScrollView>

      {/* Botões */}
      <Animated.View style={tailwind.style('px-6 py-4 bg-gray-50 border-t border-gray-200')}>
        <Animated.View style={tailwind.style('flex-row')}>
          <Animated.View style={tailwind.style('flex-1 mr-3')}>
            <Button
              variant="secondary"
              handlePress={onCancel}
              text={i18n.t('KANBAN.FORM.CANCEL')}
            />
          </Animated.View>
          <Animated.View style={tailwind.style('flex-1')}>
            <Button
              variant="primary"
              handlePress={handleSubmit}
              text={loading ? i18n.t('KANBAN.FORM.SAVING') : item ? i18n.t('KANBAN.FORM.UPDATE') : i18n.t('KANBAN.FORM.CREATE')}
              disabled={loading}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
