import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
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

  const handleSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <Animated.View style={tailwind.style('mb-4')}>
      <Animated.Text style={tailwind.style('text-sm font-inter-medium-24 text-gray-700 mb-2')}>
        {label}
      </Animated.Text>
      
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={tailwind.style('border border-gray-300 rounded-lg p-3 flex-row justify-between items-center')}>
        <Animated.Text style={tailwind.style('text-base font-inter-medium-24 text-gray-900')}>
          {selectedOption ? selectedOption.name : placeholder}
        </Animated.Text>
        <Icon 
          icon={isOpen ? <CaretBottomSmall /> : <CaretRight />} 
          size={20} 
        />
      </Pressable>

      {isOpen && (
        <Animated.View style={tailwind.style('border border-gray-300 border-t-0 rounded-b-lg bg-white')}>
          {options.map((option, index) => (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option)}
              style={tailwind.style(
                `p-3 ${
                  index === options.length - 1 ? '' : 'border-b border-gray-200'
                } ${
                  selectedOption?.id === option.id ? 'bg-blue-50' : ''
                }`
              )}>
              <Animated.Text style={tailwind.style('text-base font-inter-medium-24')}>
                {option.name}
              </Animated.Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};
