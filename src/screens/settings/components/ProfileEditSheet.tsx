import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

import { BottomSheetBackdrop, BottomSheetHeader, Icon } from '@/components-next';
import { useRefsContext, useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectUser } from '@/store/auth/authSelectors';
import { authActions } from '@/store/auth/authActions';
import { tailwind } from '@/theme';
import { CameraIcon, PhotosIcon } from '@/svg-icons';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';

export const ProfileEditSheet = () => {
  const { profileEditSheetRef } = useRefsContext();
  const { isDark, colors } = useThemeContext();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [name, setName] = useState(user?.name || '');
  const [displayName, setDisplayName] = useState(user?.available_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDisplayName(user.available_name || '');
      setEmail(user.email || '');
      setAvatarUri(null);
      setSelectedImage(null);
    }
  }, [user]);

  const handleOpenPhotosLibrary = async () => {
    const pickedAssets = await launchImageLibrary({
      quality: 0.8,
      selectionLimit: 1,
      mediaType: 'photo',
      presentationStyle: 'formSheet',
    });

    if (pickedAssets.didCancel) {
      return;
    }

    if (pickedAssets.errorCode) {
      Alert.alert(
        i18n.t('PROFILE_EDIT.PERMISSION_DENIED'),
        i18n.t('PROFILE_EDIT.PHOTO_PERMISSION_MESSAGE'),
        [
          { text: i18n.t('COMMON.CLOSE'), style: 'cancel' },
          { text: i18n.t('PROFILE_EDIT.OPEN_SETTINGS'), onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    if (pickedAssets.assets && pickedAssets.assets.length > 0) {
      const asset = pickedAssets.assets[0];
      setAvatarUri(asset.uri || null);
      setSelectedImage(asset);
    }
  };

  const handleLaunchCamera = async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const result = await request(permission);

    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        i18n.t('PROFILE_EDIT.PERMISSION_DENIED'),
        i18n.t('PROFILE_EDIT.CAMERA_PERMISSION_MESSAGE'),
        [
          { text: i18n.t('COMMON.CLOSE'), style: 'cancel' },
          { text: i18n.t('PROFILE_EDIT.OPEN_SETTINGS'), onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    if (result === RESULTS.GRANTED) {
      const imageResult = await launchCamera({
        presentationStyle: 'formSheet',
        mediaType: 'photo',
        quality: 0.8,
      });

      if (!imageResult.didCancel && !imageResult.errorCode && imageResult.assets?.length) {
        const asset = imageResult.assets[0];
        setAvatarUri(asset.uri || null);
        setSelectedImage(asset);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({ message: i18n.t('PROFILE_EDIT.NAME_REQUIRED') });
      return;
    }

    if (!email.trim()) {
      showToast({ message: i18n.t('PROFILE_EDIT.EMAIL_REQUIRED') });
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        name: string;
        email: string;
        display_name: string;
        avatar?: { uri: string; type: string; name: string } | null;
      } = {
        name: name.trim(),
        email: email.trim(),
        display_name: displayName.trim() || name.trim(),
      };

      if (selectedImage && selectedImage.uri) {
        payload.avatar = {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'avatar.jpg',
        };
      }

      await dispatch(authActions.updateProfile(payload)).unwrap();
      showToast({ message: i18n.t('PROFILE_EDIT.SUCCESS') });
      profileEditSheetRef.current?.dismiss({ overshootClamping: true });
    } catch (error) {
      showToast({ message: i18n.t('PROFILE_EDIT.ERROR') });
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatarUrl = avatarUri || user?.avatar_url;

  const inputBgColor = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const inputTextColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const labelColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const placeholderColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <BottomSheetModal
      ref={profileEditSheetRef}
      backdropComponent={BottomSheetBackdrop}
      backgroundStyle={tailwind.style(isDark ? 'bg-gray-950' : 'bg-white')}
      handleIndicatorStyle={tailwind.style(
        `overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-gray-600' : 'bg-blackA-A6'}`,
      )}
      handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
      style={tailwind.style('rounded-[26px] overflow-hidden')}
      enablePanDownToClose
      snapPoints={['85%']}
      enableDynamicSizing={false}>
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style('pb-8')}>
        <BottomSheetHeader headerText={i18n.t('PROFILE_EDIT.TITLE')} />

        {/* Avatar Section */}
        <View style={tailwind.style('items-center pt-4 pb-6')}>
          <View style={tailwind.style('relative')}>
            {currentAvatarUrl ? (
              <Image
                source={{ uri: currentAvatarUrl }}
                style={tailwind.style('w-24 h-24 rounded-full')}
              />
            ) : (
              <View
                style={tailwind.style(
                  `w-24 h-24 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`,
                )}>
                <Animated.Text
                  style={tailwind.style(`text-3xl font-inter-580-24 ${colors.textSecondary}`)}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </Animated.Text>
              </View>
            )}
          </View>

          {/* Photo Options */}
          <View style={tailwind.style('flex-row gap-4 mt-4')}>
            <Pressable
              onPress={handleLaunchCamera}
              style={tailwind.style(
                `flex-row items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`,
              )}>
              <Icon icon={<CameraIcon stroke={isDark ? '#E5E7EB' : '#374151'} />} size={20} />
              <Animated.Text
                style={tailwind.style(`ml-2 text-sm font-inter-420-20 ${colors.textPrimary}`)}>
                {i18n.t('PROFILE_EDIT.CAMERA')}
              </Animated.Text>
            </Pressable>

            <Pressable
              onPress={handleOpenPhotosLibrary}
              style={tailwind.style(
                `flex-row items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`,
              )}>
              <Icon icon={<PhotosIcon stroke={isDark ? '#E5E7EB' : '#374151'} />} size={20} />
              <Animated.Text
                style={tailwind.style(`ml-2 text-sm font-inter-420-20 ${colors.textPrimary}`)}>
                {i18n.t('PROFILE_EDIT.PHOTOS')}
              </Animated.Text>
            </Pressable>
          </View>
        </View>

        {/* Form Fields */}
        <View style={tailwind.style('px-4')}>
          {/* Name Field */}
          <View style={tailwind.style('mb-4')}>
            <Animated.Text
              style={tailwind.style(`text-sm font-inter-420-20 mb-2 ${labelColor}`)}>
              {i18n.t('PROFILE_EDIT.NAME')}
            </Animated.Text>
            <TextInput
              style={tailwind.style(
                `px-4 py-3 rounded-lg text-base font-inter-normal-20 ${inputBgColor} ${inputTextColor}`,
              )}
              value={name}
              onChangeText={setName}
              placeholder={i18n.t('PROFILE_EDIT.NAME_PLACEHOLDER')}
              placeholderTextColor={placeholderColor}
              autoCapitalize="words"
            />
          </View>

          {/* Display Name Field */}
          <View style={tailwind.style('mb-4')}>
            <Animated.Text
              style={tailwind.style(`text-sm font-inter-420-20 mb-2 ${labelColor}`)}>
              {i18n.t('PROFILE_EDIT.DISPLAY_NAME')}
            </Animated.Text>
            <TextInput
              style={tailwind.style(
                `px-4 py-3 rounded-lg text-base font-inter-normal-20 ${inputBgColor} ${inputTextColor}`,
              )}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={i18n.t('PROFILE_EDIT.DISPLAY_NAME_PLACEHOLDER')}
              placeholderTextColor={placeholderColor}
              autoCapitalize="words"
            />
          </View>

          {/* Email Field */}
          <View style={tailwind.style('mb-6')}>
            <Animated.Text
              style={tailwind.style(`text-sm font-inter-420-20 mb-2 ${labelColor}`)}>
              {i18n.t('PROFILE_EDIT.EMAIL')}
            </Animated.Text>
            <TextInput
              style={tailwind.style(
                `px-4 py-3 rounded-lg text-base font-inter-normal-20 ${inputBgColor} ${inputTextColor}`,
              )}
              value={email}
              onChangeText={setEmail}
              placeholder={i18n.t('PROFILE_EDIT.EMAIL_PLACEHOLDER')}
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={({ pressed }) =>
              tailwind.style(
                'py-3 rounded-lg items-center justify-center',
                pressed ? 'bg-blue-700' : 'bg-blue-600',
                isLoading ? 'opacity-70' : '',
              )
            }>
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Animated.Text style={tailwind.style('text-white text-base font-inter-580-24')}>
                {i18n.t('PROFILE_EDIT.SAVE')}
              </Animated.Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default ProfileEditSheet;
