import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useHaptic, useScaleAnimation } from '@/utils';

type ButtonProps = {
  isDestructive?: boolean;
  text: string;
  handlePress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

const getButtonStyles = (isPrimary: boolean, pressed: boolean, isDark: boolean) => {
  const baseStyles = 'py-[11px] flex items-center justify-center rounded-[13px]';
  const variantStyles = isPrimary 
    ? 'bg-blue-800' 
    : isDark ? 'bg-gray-800' : 'bg-gray-50';
  const pressedStyles = isPrimary 
    ? 'opacity-95' 
    : pressed 
      ? isDark ? 'bg-gray-700' : 'bg-gray-100' 
      : '';

  return tailwind.style(baseStyles, variantStyles, pressedStyles);
};

const getTextStyles = (isPrimary: boolean, isDestructive: boolean, isDark: boolean) => {
  const baseStyles = 'text-base font-medium tracking-[0.16px] leading-[22px]';
  const colorStyles = isPrimary
    ? isDestructive
      ? 'text-tomato-800'
      : 'text-white'
    : isDestructive
      ? isDark ? 'text-red-400' : 'text-ruby-800'
      : isDark ? 'text-gray-100' : 'text-gray-950';

  return tailwind.style(baseStyles, colorStyles);
};

export const Button = ({
  text,
  isDestructive = false,
  handlePress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const haptic = useHaptic(isDestructive ? 'medium' : 'selection');
  const { isDark } = useThemeContext();

  const handleButtonPress = useCallback(() => {
    if (!disabled) {
      haptic?.();
      handlePress?.();
    }
  }, [disabled, handlePress, haptic]);

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handleButtonPress}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => getButtonStyles(isPrimary, pressed, isDark)}
        {...handlers}>
        <Animated.Text style={getTextStyles(isPrimary, isDestructive, isDark)}>{text}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
};
