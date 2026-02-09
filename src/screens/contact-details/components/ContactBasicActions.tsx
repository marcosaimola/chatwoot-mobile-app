import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon, IconButton } from '@/components-next';

import { ChatIcon, MailIcon, PhoneIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';
import { useThemeContext } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { openNumber, openEmail } from '@/utils/urlUtils';

type ContactOption = {
  key: 'call' | 'email' | 'chat';
  contactType: string;
  icon: React.ReactNode;
};

type ContactOptionProps = {
  option: ContactOption;
  handleOptionPress?: () => void;
  isDark: boolean;
};

const ContactOptionComponent = (props: ContactOptionProps) => {
  const { option, handleOptionPress, isDark } = props;

  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handleOnPress = () => {
    hapticSelection?.();
    handleOptionPress?.();
  };

  return (
    <Animated.View style={[tailwind.style('flex-1'), animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          tailwind.style(
            'items-center justify-center rounded-xl py-3',
            isDark ? 'bg-grayDark-200' : 'bg-gray-50',
            pressed ? (isDark ? 'bg-grayDark-300' : 'bg-gray-100') : '',
          ),
        ]}
        onPress={handleOnPress}
        {...handlers}>
        <Icon icon={option.icon} size={24} />
        <Text
          numberOfLines={1}
          style={tailwind.style(
            'text-cxs font-inter-medium-24 tracking-[0.32px] text-center pt-2',
            isDark ? 'text-blueDark-700' : 'text-blue-800',
          )}>
          {option.contactType}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

type ContactBasicActionsProps = {
  phoneNumber?: string;
  email?: string;
  onChatPress?: () => void;
};

export const ContactBasicActions = (props: ContactBasicActionsProps) => {
  const { phoneNumber, email, onChatPress } = props;
  const { isDark } = useThemeContext();

  const iconColor = tailwind.color(isDark ? 'bg-blueDark-700' : 'bg-blue-800');

  const onCallPress = () => {
    if (phoneNumber) {
      openNumber({ phoneNumber });
    }
  };

  const onEmailPress = () => {
    if (email) {
      openEmail({ email });
    }
  };

  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string): string => {
    const translation = i18n.t(key);
    // Verificar se é nulo, vazio ou se é a própria chave (falha de tradução comum)
    if (!translation || translation.trim() === '' || translation.includes('missing') || translation === key) {
      return fallback;
    }
    return translation;
  };

  const options: ContactOption[] = [];

  if (email) {
    options.push({
      key: 'email',
      contactType: getTranslation('CONTACT_DETAILS.EMAIL', 'e-mail'),
      icon: <MailIcon strokeWidth={2} stroke={iconColor} />,
    });
  }

  if (phoneNumber) {
    options.push({
      key: 'call',
      contactType: getTranslation('CONTACT_DETAILS.CALL', 'Chamada'),
      icon: <PhoneIcon strokeWidth={2} stroke={iconColor} />,
    });
  }

  if (onChatPress) {
    options.push({
      key: 'chat',
      contactType: getTranslation('CONTACT_DETAILS.CHAT', 'Conversar'),
      icon: <ChatIcon strokeWidth={2} stroke={iconColor} />,
    });
  }

  if (!options.length) {
    return null;
  }

  if (options.length > 1) {
    return (
      <View style={tailwind.style('flex flex-row gap-3')}>
        {options.map(option => (
          <ContactOptionComponent
            key={option.key}
            option={option}
            isDark={isDark}
            handleOptionPress={() => {
              if (option.key === 'email') onEmailPress();
              if (option.key === 'call') onCallPress();
              if (option.key === 'chat') onChatPress?.();
            }}
          />
        ))}
      </View>
    );
  }

  const singleOption = options[0];
  const handleSinglePress = () => {
    if (singleOption.key === 'email') onEmailPress();
    if (singleOption.key === 'call') onCallPress();
    if (singleOption.key === 'chat') onChatPress?.();
  };

  return (
    <IconButton
      text={singleOption.contactType}
      variant="secondary"
      handlePress={handleSinglePress}
    />
  );
};
