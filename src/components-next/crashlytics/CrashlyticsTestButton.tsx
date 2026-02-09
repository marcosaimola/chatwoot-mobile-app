import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { tailwind } from '@/theme';
import crashlyticsService from '@/services/CrashlyticsService';

/**
 * CrashlyticsTestButton
 * 
 * A component for testing Firebase Crashlytics integration.
 * ⚠️ This component should only be used in development/testing environments.
 * 
 * Features:
 * - Test fatal crash (app will crash)
 * - Test non-fatal error recording
 * - Set test user attributes
 */
export function CrashlyticsTestButton() {
  const handleTestCrash = () => {
    Alert.alert(
      'Test Crash',
      'This will force the app to crash. The crash report will be sent to Firebase Crashlytics when you restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash Now',
          style: 'destructive',
          onPress: () => {
            crashlyticsService.log('User triggered test crash');
            crashlyticsService.testCrash();
          },
        },
      ],
    );
  };

  const handleTestNonFatalError = () => {
    try {
      // Set some test attributes
      crashlyticsService.setAttributes({
        test_type: 'non-fatal-error',
        test_environment: __DEV__ ? 'development' : 'production',
        test_timestamp: new Date().toISOString(),
      });

      // Log some context
      crashlyticsService.log('Testing non-fatal error recording');

      // Record a non-fatal error
      crashlyticsService.recordError(
        new Error('This is a test non-fatal error'),
        'User triggered test from CrashlyticsTestButton',
      );

      Alert.alert('Success', 'Non-fatal error recorded. Check Firebase Crashlytics console in a few minutes.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record non-fatal error');
      console.error('Failed to record non-fatal error:', error);
    }
  };

  const handleSetTestUser = () => {
    try {
      const testUserId = `test-user-${Date.now()}`;
      crashlyticsService.setUserId(testUserId);
      crashlyticsService.setAttributes({
        user_type: 'test-user',
        test_session: 'true',
      });
      Alert.alert('Success', `Test user ID set: ${testUserId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to set test user');
      console.error('Failed to set test user:', error);
    }
  };

  if (!__DEV__) {
    // Don't show test buttons in production
    return null;
  }

  return (
    <View style={tailwind('p-4 bg-gray-100 rounded-lg mb-4')}>
      <Text style={tailwind('text-lg font-inter-medium-24 mb-3 text-gray-900')}>
        Crashlytics Test Panel
      </Text>
      
      <Text style={tailwind('text-sm font-inter-normal-20 mb-3 text-gray-600')}>
        ⚠️ Development only - These buttons test Firebase Crashlytics integration
      </Text>

      <TouchableOpacity
        style={tailwind('bg-red-600 p-3 rounded-lg mb-2')}
        onPress={handleTestCrash}
        activeOpacity={0.7}>
        <Text style={tailwind('text-white text-center font-inter-medium-24')}>
          🔥 Test Fatal Crash
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={tailwind('bg-orange-600 p-3 rounded-lg mb-2')}
        onPress={handleTestNonFatalError}
        activeOpacity={0.7}>
        <Text style={tailwind('text-white text-center font-inter-medium-24')}>
          ⚠️ Test Non-Fatal Error
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={tailwind('bg-blue-600 p-3 rounded-lg')}
        onPress={handleSetTestUser}
        activeOpacity={0.7}>
        <Text style={tailwind('text-white text-center font-inter-medium-24')}>
          👤 Set Test User ID
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default CrashlyticsTestButton;
