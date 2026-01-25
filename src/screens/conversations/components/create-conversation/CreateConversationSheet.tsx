import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, Pressable, Modal, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Icon } from '@/components-next/common';
import { getChannelIcon } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectApiAndWhatsAppInboxes } from '@/store/inbox/inboxSelectors';
import { conversationActions } from '@/store/conversation/conversationActions';
import { Channel, Inbox } from '@/types';
import { InboxTypes } from '@/types/common/Channel';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';

export interface CreateConversationSheetHandle {
  present: (phoneNumber: string) => void;
  dismiss: () => void;
}

interface InboxItemProps {
  inbox: Inbox;
  isLastItem: boolean;
  onSelect: (inbox: Inbox) => void;
  isLoading: boolean;
  selectedInboxId: number | null;
}

const InboxItem = ({ inbox, isLastItem, onSelect, isLoading, selectedInboxId }: InboxItemProps) => {
  const { isDark } = useThemeContext();
  const isSelected = selectedInboxId === inbox.id;
  const isWhatsApp = inbox.channelType === InboxTypes.WHATSAPP;

  return (
    <Pressable
      onPress={() => onSelect(inbox)}
      disabled={isLoading}
      style={({ pressed }) => [
        tailwind.style(
          'flex flex-row items-center px-4 py-3',
          pressed && !isLoading && (isDark ? 'bg-gray-800' : 'bg-gray-100'),
        ),
      ]}>
      <Icon
        icon={getChannelIcon(inbox.channelType as Channel, inbox.medium, '')}
        size={24}
        style={tailwind.style('mr-3')}
      />
      <View style={tailwind.style('flex-1')}>
        <Animated.Text
          style={tailwind.style(
            'text-base font-inter-medium-24',
            isDark ? 'text-gray-100' : 'text-gray-900',
          )}>
          {inbox.name}
        </Animated.Text>
        {isWhatsApp && (
          <Animated.Text
            style={tailwind.style(
              'text-sm font-inter-normal-20 mt-0.5',
              isDark ? 'text-yellow-400' : 'text-yellow-600',
            )}>
            {i18n.t('CREATE_CONVERSATION.WHATSAPP_TEMPLATE_REQUIRED')}
          </Animated.Text>
        )}
      </View>
      {isLoading && isSelected && (
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      )}
    </Pressable>
  );
};

export const CreateConversationSheet = forwardRef<CreateConversationSheetHandle, object>(
  (_, ref) => {
    const { isDark } = useThemeContext();
    const { bottom } = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const navigation = useNavigation();

    const [isVisible, setIsVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInboxId, setSelectedInboxId] = useState<number | null>(null);

    const inboxes = useAppSelector(selectApiAndWhatsAppInboxes);

    useImperativeHandle(ref, () => ({
      present: (phone: string) => {
        setPhoneNumber(phone);
        setIsVisible(true);
      },
      dismiss: () => {
        setIsVisible(false);
        setPhoneNumber('');
        setIsLoading(false);
        setSelectedInboxId(null);
      },
    }));

    const handleDismiss = useCallback(() => {
      setIsVisible(false);
      setPhoneNumber('');
      setIsLoading(false);
      setSelectedInboxId(null);
    }, []);

    const handleSelectInbox = useCallback(
      async (inbox: Inbox) => {
        if (isLoading) return;

        setIsLoading(true);
        setSelectedInboxId(inbox.id);

        try {
          const result = await dispatch(
            conversationActions.createConversationFromPhone({
              phoneNumber,
              inboxId: inbox.id,
            }),
          ).unwrap();

          handleDismiss();

          // Navigate to the chat screen
          const pushToChatScreen = StackActions.push('ChatScreen', {
            conversationId: result.conversationId,
          });
          navigation.dispatch(pushToChatScreen);

          showToast({ message: i18n.t('CREATE_CONVERSATION.SUCCESS') });
        } catch (error) {
          setIsLoading(false);
          setSelectedInboxId(null);
          
          // Try to get a more specific error message
          const errorData = error as { errors?: string[] };
          const errorMessage = errorData?.errors?.[0] || i18n.t('CREATE_CONVERSATION.ERROR');
          showToast({ message: errorMessage });
        }
      },
      [dispatch, phoneNumber, handleDismiss, navigation, isLoading],
    );

    const hasInboxes = inboxes.length > 0;

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleDismiss}>
        <View style={tailwind.style('flex-1', isDark ? 'bg-gray-950' : 'bg-white')}>
          {/* Handle indicator */}
          <View style={tailwind.style('items-center pt-2 pb-1')}>
            <View
              style={tailwind.style(
                'w-8 h-1 rounded-full',
                isDark ? 'bg-gray-600' : 'bg-gray-300',
              )}
            />
          </View>

          {/* Header */}
          <View style={tailwind.style('px-4 pt-2 pb-4 items-center')}>
            <Animated.Text
              style={tailwind.style(
                'text-lg font-inter-semibold-20',
                isDark ? 'text-gray-100' : 'text-gray-900',
              )}>
              {i18n.t('CREATE_CONVERSATION.TITLE')}
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-md font-inter-medium-24 mt-1',
                isDark ? 'text-blue-400' : 'text-blue-600',
              )}>
              {phoneNumber}
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-sm font-inter-normal-20 mt-2 text-center',
                isDark ? 'text-gray-400' : 'text-gray-600',
              )}>
              {i18n.t('CREATE_CONVERSATION.SUBTITLE')}
            </Animated.Text>
          </View>

          {/* Inboxes List */}
          {hasInboxes ? (
            <Animated.ScrollView
              contentContainerStyle={{ paddingBottom: bottom + 16 }}
              style={tailwind.style('flex-1')}>
              {inboxes.map((inbox, index) => (
                <InboxItem
                  key={inbox.id}
                  inbox={inbox}
                  isLastItem={index === inboxes.length - 1}
                  onSelect={handleSelectInbox}
                  isLoading={isLoading}
                  selectedInboxId={selectedInboxId}
                />
              ))}
            </Animated.ScrollView>
          ) : (
            <View style={tailwind.style('flex-1 items-center justify-center px-4')}>
              <Animated.Text
                style={tailwind.style(
                  'text-md font-inter-medium-24 text-center',
                  isDark ? 'text-gray-500' : 'text-gray-500',
                )}>
                {i18n.t('CREATE_CONVERSATION.NO_INBOXES')}
              </Animated.Text>
            </View>
          )}

          {/* Cancel Button */}
          <View style={tailwind.style('px-4 pb-4', `pb-[${bottom + 16}px]`)}>
            <Pressable
              onPress={handleDismiss}
              disabled={isLoading}
              style={({ pressed }) => [
                tailwind.style(
                  'py-3 px-6 rounded-xl items-center',
                  isDark ? 'bg-gray-800' : 'bg-gray-100',
                  pressed && (isDark ? 'bg-gray-700' : 'bg-gray-200'),
                  isLoading && 'opacity-50',
                ),
              ]}>
              <Animated.Text
                style={tailwind.style(
                  'text-md font-inter-medium-24',
                  isDark ? 'text-gray-100' : 'text-gray-900',
                )}>
                {i18n.t('CREATE_CONVERSATION.CANCEL')}
              </Animated.Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  },
);
