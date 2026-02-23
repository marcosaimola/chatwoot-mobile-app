import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Icon } from '@/components-next';
import { CaretRight, CaretBottomSmall } from '@/svg-icons/common';

interface DropdownOption {
  id: string;
  name: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selectedOption: DropdownOption | null;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedOption,
  onSelect,
  placeholder = 'Selecione uma opção',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, isDark } = useThemeContext();

  const handleSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <Animated.View style={tailwind.style('mb-3')}>
      <Animated.Text style={tailwind.style(`text-xs font-inter-medium-24 mb-1 ${colors.textSecondary}`)}>
        {label}
      </Animated.Text>
      
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={tailwind.style(`border rounded-lg px-2.5 py-1.5 flex-row justify-between items-center ${colors.borderPrimary} ${colors.bgInput}`)}>
        <Animated.Text style={tailwind.style(`text-sm font-inter-medium-24 ${selectedOption ? colors.textPrimary : colors.textTertiary}`)}>
          {selectedOption ? selectedOption.name : placeholder}
        </Animated.Text>
        <Icon 
          icon={isOpen ? <CaretBottomSmall stroke={isDark ? '#9CA3AF' : undefined} /> : <CaretRight stroke={isDark ? '#9CA3AF' : undefined} />} 
          size={16} 
        />
      </Pressable>

      {isOpen && (
        <Animated.View style={tailwind.style(`border border-t-0 rounded-b-lg ${colors.borderPrimary} ${colors.bgInput}`)}>
          {options.map((option, index) => (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option)}
              style={tailwind.style(
                `px-2.5 py-1.5 ${
                  index === options.length - 1 ? '' : `border-b ${colors.borderSecondary}`
                } ${
                  selectedOption?.id === option.id ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''
                }`
              )}>
              <Animated.Text style={tailwind.style(`text-sm font-inter-medium-24 ${colors.textPrimary}`)}>
                {option.name}
              </Animated.Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};
