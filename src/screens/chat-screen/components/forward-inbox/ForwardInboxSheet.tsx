import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeContext } from '@/context';
import { useAppSelector } from '@/hooks';
import { tailwind } from '@/theme';
import { Inbox } from '@/types';
import { BottomSheetBackdrop, BottomSheetWrapper, BottomSheetHeader } from '@/components-next/common/bottomsheet';
import { selectApiAndWhatsAppInboxes } from '@/store/inbox/inboxSelectors';
import { getChannelIcon } from '@/utils';
import i18n from '@/i18n';
import { useHaptic } from '@/utils';
import { Icon } from '@/components-next/common';

export interface ForwardInboxSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface ForwardInboxSheetProps {
  onInboxSelect: (inbox: Inbox) => void;
  isForwarding?: boolean;
}

export const ForwardInboxSheet = forwardRef<ForwardInboxSheetHandle, ForwardInboxSheetProps>(
  ({ onInboxSelect, isForwarding = false }, ref) => {
    const { isDark } = useThemeContext();
    const { bottom } = useSafeAreaInsets();
    const hapticSelection = useHaptic();
    const sheetRef = useRef<BottomSheetModal>(null);

    const inboxes = useAppSelector(selectApiAndWhatsAppInboxes);

    const animationConfigs = useBottomSheetSpringConfigs({
      mass: 1,
      stiffness: 420,
      damping: 30,
    });

    const snapPoints = useMemo(() => [400], []);

    useImperativeHandle(ref, () => ({
      present: () => {
        sheetRef.current?.present();
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    const handleInboxSelect = useCallback(
      (inbox: Inbox) => {
        hapticSelection?.();
        onInboxSelect(inbox);
      },
      [hapticSelection, onInboxSelect],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={tailwind.style(isDark ? 'bg-gray-950' : 'bg-white')}
        handleIndicatorStyle={tailwind.style(
          `overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-gray-600' : 'bg-blackA-A6'}`,
        )}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-t-[26px] overflow-hidden')}
        animationConfigs={animationConfigs}
        enablePanDownToClose={!isForwarding}
        snapPoints={snapPoints}>
        <BottomSheetWrapper fillHeight>
          <BottomSheetHeader headerText={i18n.t('FORWARD.SELECT_INBOX')} />

          {isForwarding ? (
            <View style={tailwind.style('flex-1 items-center justify-center py-12')}>
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#3B82F6'} />
              <Text
                style={tailwind.style(
                  'text-base font-inter-normal-20 mt-4',
                  isDark ? 'text-gray-400' : 'text-gray-500',
                )}>
                Encaminhando mensagens...
              </Text>
            </View>
          ) : (
            <BottomSheetScrollView
              style={tailwind.style('flex-1')}
              contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) }}
              showsVerticalScrollIndicator={false}>
              {inboxes.map(inbox => (
                <InboxItem
                  key={inbox.id}
                  inbox={inbox}
                  onPress={() => handleInboxSelect(inbox)}
                  isDark={isDark}
                />
              ))}

              {inboxes.length === 0 && (
                <View style={tailwind.style('py-8 items-center')}>
                  <Text
                    style={tailwind.style(
                      'text-base font-inter-normal-20',
                      isDark ? 'text-gray-400' : 'text-gray-500',
                    )}>
                    Nenhuma caixa de entrada disponível
                  </Text>
                </View>
              )}
            </BottomSheetScrollView>
          )}
        </BottomSheetWrapper>
      </BottomSheetModal>
    );
  },
);

ForwardInboxSheet.displayName = 'ForwardInboxSheet';

// Inbox Item Component
interface InboxItemProps {
  inbox: Inbox;
  onPress: () => void;
  isDark: boolean;
}

const InboxItem = ({ inbox, onPress, isDark }: InboxItemProps) => {
  const channelIcon = getChannelIcon(inbox.channelType, inbox.medium || '', '');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) =>
        tailwind.style(
          'flex-row items-center px-4 py-3',
          pressed ? (isDark ? 'bg-gray-800' : 'bg-gray-50') : '',
          isDark ? 'border-gray-800' : 'border-gray-100',
          'border-b',
        )
      }>
      {/* Channel Icon */}
      <View
        style={tailwind.style(
          'w-10 h-10 rounded-full items-center justify-center',
          isDark ? 'bg-gray-800' : 'bg-gray-100',
        )}>
        <Icon icon={channelIcon} size={20} />
      </View>

      {/* Inbox Info */}
      <View style={tailwind.style('flex-1 ml-3')}>
        <Text
          style={tailwind.style(
            'text-base font-inter-medium-24',
            isDark ? 'text-white' : 'text-gray-900',
          )}
          numberOfLines={1}>
          {inbox.name}
        </Text>
        {inbox.phoneNumber && (
          <Text
            style={tailwind.style(
              'text-sm font-inter-normal-20 mt-0.5',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
            numberOfLines={1}>
            {inbox.phoneNumber}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default ForwardInboxSheet;
