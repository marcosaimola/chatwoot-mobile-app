import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Alert, BackHandler, Platform } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { AppNavigator } from '@/navigation';
import { ThemeProvider } from '@/context';
import * as EdgeToEdge from 'react-native-edge-to-edge';

import i18n from '@/i18n';

const Chatwoot = () => {
  useEffect(() => {
    // Enable edge-to-edge display for Android 15+ compatibility
    if (Platform.OS === 'android') {
      try {
        // Call EdgeToEdge.enable() in a safe way
        if (EdgeToEdge && typeof EdgeToEdge.enable === 'function') {
          EdgeToEdge.enable();
        }
      } catch (error) {
        console.warn('EdgeToEdge.enable() failed:', error);
        // Continue app execution even if edge-to-edge fails
      }
    }

    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick);
    };
  }, []);
  const handleBackButtonClick = () => {
    Alert.alert(
      i18n.t('EXIT.TITLE'),
      i18n.t('EXIT.SUBTITLE'),
      [
        {
          text: i18n.t('EXIT.CANCEL'),
          onPress: () => {},
          style: 'cancel',
        },
        { text: i18n.t('EXIT.OK'), onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: false },
    );
    return true;
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default Chatwoot;
