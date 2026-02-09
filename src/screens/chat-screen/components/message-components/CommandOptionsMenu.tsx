import React from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateAttachments } from '@/store/conversation/sendMessageSlice';
import { useRefsContext, useThemeContext, useChatWindowContext } from '@/context';
import { AttachFileIcon, CameraIcon, MacrosIcon, PhotosIcon, UserIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';
import { Icon } from '@/components-next/common';
import { MAXIMUM_FILE_UPLOAD_SIZE } from '@/constants';
import i18n from '@/i18n';
import { showToast } from '@/utils/toastUtils';
import { findFileSize } from '@/utils/fileUtils';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { selectSingleConversation } from '@/store/conversation/conversationSelectedSlice';
import { setActionState } from '@/store/conversation/conversationActionSlice';

export const handleOpenPhotosLibrary = async dispatch => {
  const pickedAssets = await launchImageLibrary({
    quality: 1,
    selectionLimit: 10,
    mediaType: 'mixed',
    presentationStyle: 'formSheet',
  });
  if (pickedAssets.didCancel) {
  } else if (pickedAssets.errorCode) {
    Alert.alert(
      'Permission Denied',
      pickedAssets.errorMessage ||
        'The permission to access the photo library has been denied and cannot be requested again. Please enable it in your device settings if you wish to access photos from your library.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            // Open app settings
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false },
    );
  } else {
    if (pickedAssets.assets && pickedAssets.assets?.length > 0) {
      // Filter only images for multiple selection
      const images = pickedAssets.assets.filter(asset => asset.type?.includes('image'));
      if (images.length > 0) {
        validateFileAndSetAttachments(dispatch, images);
      }
    }
  }
};

const handleLaunchCamera = async dispatch => {
  request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then(
    async result => {
      if (RESULTS.BLOCKED === result) {
        Alert.alert(
          'Permission Denied',
          'The permission to access the camera has been denied and cannot be requested again. Please enable it in your device settings if you wish to use the camera feature.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open app settings
                Linking.openSettings();
              },
            },
          ],
          { cancelable: false },
        );
      }
      if (RESULTS.GRANTED === result) {
        const imageResult = await launchCamera({
          presentationStyle: 'formSheet',
          mediaType: 'mixed',
        });
        if (imageResult.didCancel) {
        } else if (imageResult.errorCode) {
        } else {
          if (imageResult.assets && imageResult.assets?.length > 0) {
            validateFileAndSetAttachments(dispatch, imageResult.assets[0]);
          }
        }
      }
    },
  );
};

/**
 * Doing this so that the our Store Object Attachments is of single type - Asset from Image Picker Library
 * The function `mapObject` takes an object of type `DocumentPickerResponse` and returns an array of
 * `Asset` objects with properties `fileName`, `fileSize`, `type`, and `uri`.
 * @param {DocumentPickerResponse} originalObject - The originalObject parameter is of type
 * DocumentPickerResponse.
 * @returns The function `mapObject` is returning an array of `Asset` objects.
 */
const mapObject = (originalObject: DocumentPickerResponse): Asset[] => {
  return [
    {
      fileName: originalObject.name || '',
      fileSize: originalObject.size || 0,
      type: originalObject.type || '',
      uri: originalObject.uri || '',
    },
  ];
};

const handleAttachFile = async dispatch => {
  try {
    const result = await DocumentPicker.pick({
      type: [
        DocumentPicker.types.allFiles,
        DocumentPicker.types.images,
        DocumentPicker.types.plainText,
        DocumentPicker.types.audio,
        DocumentPicker.types.pdf,
        DocumentPicker.types.zip,
        DocumentPicker.types.csv,
        DocumentPicker.types.doc,
        DocumentPicker.types.docx,
        DocumentPicker.types.ppt,
        DocumentPicker.types.pptx,
        DocumentPicker.types.xls,
        DocumentPicker.types.xlsx,
      ], // You can specify the file types you want to allow
      presentationStyle: 'formSheet',
    });
    // TODO: Support multiple files
    const file = mapObject(result[0])[0];
    validateFileAndSetAttachments(dispatch, file);
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      // User cancelled the picker
    } else {
      throw err;
    }
  }
};

type MenuOptionConfig = {
  icon: React.ReactElement;
  title: string;
  handlePress: (dispatch: ReturnType<typeof useAppDispatch>) => void;
  iconBgColor: string;
  isSpecialAction?: boolean;
};

const getAddMenuOptions = (iconColor: string, iconBgColor: string): MenuOptionConfig[] => [
  {
    icon: <CameraIcon stroke={iconColor} />,
    title: i18n.t('ATTACHMENT_MENU.CAMERA'),
    handlePress: handleLaunchCamera,
    iconBgColor,
  },
  {
    icon: <PhotosIcon stroke={iconColor} />,
    title: i18n.t('ATTACHMENT_MENU.PHOTOS'),
    handlePress: handleOpenPhotosLibrary,
    iconBgColor,
  },
  {
    icon: <AttachFileIcon stroke={iconColor} />,
    title: i18n.t('ATTACHMENT_MENU.ATTACH_FILE'),
    handlePress: handleAttachFile,
    iconBgColor,
  },
  {
    icon: <MacrosIcon stroke={iconColor} />,
    title: i18n.t('ATTACHMENT_MENU.MACROS'),
    handlePress: () => {},
    iconBgColor,
    isSpecialAction: true,
  },
];

const getAssignMenuOption = (iconColor: string, iconBgColor: string): MenuOptionConfig => ({
  icon: <UserIcon stroke={iconColor} />,
  title: i18n.t('ATTACHMENT_MENU.ASSIGN'),
  handlePress: () => {},
  iconBgColor,
  isSpecialAction: true,
});

export const validateFileAndSetAttachments = async (
  dispatch: ReturnType<typeof useAppDispatch>,
  attachments: Asset | Asset[],
) => {
  const attachmentsArray = Array.isArray(attachments) ? attachments : [attachments];
  
  // Validate file sizes
  const validAttachments: Asset[] = [];
  let hasInvalidSize = false;

  for (const attachment of attachmentsArray) {
    const { fileSize } = attachment;
    if (findFileSize(fileSize) <= MAXIMUM_FILE_UPLOAD_SIZE) {
      validAttachments.push(attachment);
    } else {
      hasInvalidSize = true;
    }
  }

  if (hasInvalidSize) {
    showToast({ message: i18n.t('CONVERSATION.FILE_SIZE_LIMIT') });
  }

  // The reducer will handle limit validation (10 images, 1 non-image)
  if (validAttachments.length > 0) {
    dispatch(updateAttachments(validAttachments));
  }
};

type MenuOptionProps = {
  menuOption: MenuOptionConfig;
  onSpecialAction?: () => void;
};

const MenuOption = (props: MenuOptionProps) => {
  const { menuOption, onSpecialAction } = props;
  const dispatch = useAppDispatch();
  const { colors } = useThemeContext();

  const { animatedStyle, handlers } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    if (menuOption.isSpecialAction && onSpecialAction) {
      onSpecialAction();
    } else {
      menuOption?.handlePress(dispatch);
    }
  };

  return (
    <Animated.View style={[tailwind.style('items-center justify-center w-1/4 mb-4'), animatedStyle]}>
      <Pressable onPress={handlePress} {...handlers} style={tailwind.style('items-center')}>
        <View
          style={tailwind.style(
            `w-12 h-12 rounded-full items-center justify-center ${menuOption.iconBgColor}`,
          )}>
          <Icon icon={menuOption.icon} size={24} />
        </View>
        <Text
          style={tailwind.style(
            `text-xs font-inter-normal-20 leading-[14px] tracking-[0.24px] mt-2 text-center ${colors.textPrimary}`,
          )}
          numberOfLines={2}>
          {menuOption.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const CommandOptionsMenu = () => {
  const { bottom } = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const dispatch = useAppDispatch();
  const { macrosListSheetRef, actionsModalSheetRef } = useRefsContext();
  const { conversationId } = useChatWindowContext();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  const isAndroid = Platform.OS === 'android';
  const containerHeight = isAndroid
    ? 130 + (bottom === 0 ? 16 : bottom)
    : 120 + (bottom === 0 ? 16 : bottom);

  // Colors for better visibility in both themes
  const iconColor = isDark ? '#E5E7EB' : '#374151';
  const iconBgColor = isDark ? 'bg-gray-800' : 'bg-gray-100';

  const menuOptions = getAddMenuOptions(iconColor, iconBgColor);
  const assignOption = getAssignMenuOption(iconColor, iconBgColor);

  // Combine all options
  const allOptions = [...menuOptions, assignOption];

  const handleMacrosPress = () => {
    macrosListSheetRef.current?.present();
  };

  const handleAssignPress = () => {
    if (!conversation) return;
    dispatch(selectSingleConversation(conversation));
    dispatch(setActionState('Assign'));
    actionsModalSheetRef.current?.present();
  };

  const getSpecialActionHandler = (title: string) => {
    if (title === i18n.t('ATTACHMENT_MENU.MACROS')) {
      return handleMacrosPress;
    }
    if (title === i18n.t('ATTACHMENT_MENU.ASSIGN')) {
      return handleAssignPress;
    }
    return undefined;
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(38).stiffness(240)}
      exiting={SlideOutDown.springify().damping(38).stiffness(240)}
      style={tailwind.style(
        'mx-1 pt-4 pb-2',
        `h-[${containerHeight}px]`,
      )}>
      <View style={tailwind.style('flex-row flex-wrap justify-start')}>
        {allOptions.map(menuOption => {
          return (
            <MenuOption
              key={menuOption.title}
              menuOption={menuOption}
              onSpecialAction={getSpecialActionHandler(menuOption.title)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};
