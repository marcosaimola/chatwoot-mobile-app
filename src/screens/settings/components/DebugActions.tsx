import React, { useState, useEffect } from 'react';
import { Pressable, Text, Animated, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { showToast } from '@/utils/toastUtils';
import { tailwind } from '@/theme';
import { useHaptic } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectChatwootVersion,
  selectInstallationUrl,
  selectPushToken,
  selectWebSocketUrl,
} from '@/store/settings/settingsSelectors';
import { clearAllCaches, getTotalCacheSize, formatCacheSize } from '@/utils/cacheManager';
import { persistor } from '@/store';
import { logout } from '@/store/auth/authSlice';

type DebugActionCellProps = {
  item: DebugAction;
  index: number;
  isLastItem: boolean;
};

interface DebugAction {
  key: string;
  label: string;
  value?: string;
}

const DEBUG_ACTIONS: DebugAction[] = [
  {
    key: 'chatwoot_version',
    label: 'Chatwoot Version',
    value: '',
  },
  {
    key: 'installation_url',
    label: 'Installation URL',
    value: '',
  },
  {
    key: 'web_socket_url',
    label: 'Web Socket URL',
    value: '',
  },
  {
    key: 'push_token',
    label: 'Push Token',
    value: '',
  },
  {
    key: 'clear_cache',
    label: 'Limpar Cache de Áudio',
    value: '',
  },
  {
    key: 'clear_local_data',
    label: 'Limpar Dados Locais',
    value: '',
  },
];

const DebugActionCell = ({ item, index, isLastItem }: DebugActionCellProps) => {
  const installationUrl = useAppSelector(selectInstallationUrl);
  const webSocketUrl = useAppSelector(selectWebSocketUrl);
  const version = useAppSelector(selectChatwootVersion);
  const pushToken = useAppSelector(selectPushToken);
  const dispatch = useAppDispatch();

  const [cacheSize, setCacheSize] = useState<string>('Carregando...');
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingLocalData, setIsClearingLocalData] = useState(false);

  const hapticSelection = useHaptic();

  // Load cache size on mount
  useEffect(() => {
    if (item.key === 'clear_cache') {
      loadCacheSize();
    }
  }, [item.key]);

  const loadCacheSize = async () => {
    const size = await getTotalCacheSize();
    setCacheSize(formatCacheSize(size));
  };

  const handlePress = async (actionItem: DebugAction) => {
    hapticSelection?.();

    // Handle clear cache action
    if (actionItem.key === 'clear_cache') {
      if (isClearing) return;

      setIsClearing(true);
      setCacheSize('Limpando...');

      try {
        await clearAllCaches();
        showToast({ message: 'Cache de áudio limpo com sucesso' });
        await loadCacheSize();
      } catch {
        showToast({ message: 'Erro ao limpar cache' });
        await loadCacheSize();
      } finally {
        setIsClearing(false);
      }
      return;
    }

    if (actionItem.key === 'clear_local_data') {
      if (isClearingLocalData) return;

      setIsClearingLocalData(true);
      try {
        await AsyncStorage.removeItem('cwCookie');
        await AsyncStorage.removeItem('persist:Root');
        await persistor.purge();
        dispatch(logout());
        showToast({ message: 'Dados locais limpos. Faça login novamente.' });
      } catch {
        showToast({ message: 'Erro ao limpar dados locais' });
      } finally {
        setIsClearingLocalData(false);
      }
      return;
    }

    // Handle other debug actions (copy to clipboard)
    const value = debugValue(actionItem.key);
    if (value) {
      Clipboard.setString(value);
      showToast({ message: `${actionItem.label} copied to clipboard` });
    }
  };

  const debugValue = (key: string) => {
    switch (key) {
      case 'installation_url':
        return installationUrl;
      case 'web_socket_url':
        return webSocketUrl;
      case 'chatwoot_version':
        return version;
      case 'push_token':
        return pushToken;
      case 'clear_cache':
        return cacheSize;
      case 'clear_local_data':
        return 'Requer login novamente';
      default:
        return '';
    }
  };

  return (
    <Pressable
      onPress={() => handlePress(item)}
      disabled={
        (item.key === 'clear_cache' && isClearing) ||
        (item.key === 'clear_local_data' && isClearingLocalData)
      }>
      <Animated.View style={tailwind.style('flex flex-row items-center')}>
        <Animated.View
          style={tailwind.style(
            'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
            !isLastItem && 'border-b-[1px] border-blackA-A3',
          )}>
          <View>
            <Text
              style={tailwind.style(
                'text-base  text-gray-950 font-inter-420-20 leading-[21px] tracking-[0.16px]',
              )}>
              {item.label}
            </Text>
            <Text
              numberOfLines={2}
              style={tailwind.style(
                'text-sm text-gray-900 font-inter-420-20 leading-[18px] tracking-[0.16px] italic',
              )}>
              {debugValue(item.key)}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const DebugActions = () => (
  <Animated.View style={tailwind.style('py-1 pl-3')}>
    {DEBUG_ACTIONS.map((item, index) => (
      <DebugActionCell
        key={item.key}
        item={item}
        index={index}
        isLastItem={index === DEBUG_ACTIONS.length - 1}
      />
    ))}
  </Animated.View>
);
