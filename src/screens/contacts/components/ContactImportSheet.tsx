import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useHaptic } from '@/utils';

type ContactImportOption = {
  label: string;
  onPress: () => void;
};

type ContactImportSheetProps = {
  onCreateNew: () => void;
  onImportContacts: () => void;
};

const OptionCell = ({
  option,
  index,
  isLast,
  colors,
}: {
  option: ContactImportOption;
  index: number;
  isLast: boolean;
  colors: {
    textPrimary: string;
    borderPrimary: string;
  };
}) => {
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    option.onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={tailwind.style(
          'flex-row items-center py-[15px] px-4',
          !isLast && `border-b-[1px] ${colors.borderPrimary}`,
        )}>
        <Text
          style={tailwind.style(
            `text-base font-inter-420-20 leading-[21px] tracking-[0.16px] ${colors.textPrimary}`,
          )}>
          {option.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const ContactImportSheet = ({
  onCreateNew,
  onImportContacts,
}: ContactImportSheetProps) => {
  const { colors } = useThemeContext();

  const options: ContactImportOption[] = [
    {
      label: 'Criar novo',
      onPress: onCreateNew,
    },
    {
      label: 'Importar contatos',
      onPress: onImportContacts,
    },
  ];

  return (
    <Animated.View style={tailwind.style('py-1')}>
      {options.map((option, index) => (
        <OptionCell
          key={option.label}
          option={option}
          index={index}
          isLast={index === options.length - 1}
          colors={colors}
        />
      ))}
    </Animated.View>
  );
};
