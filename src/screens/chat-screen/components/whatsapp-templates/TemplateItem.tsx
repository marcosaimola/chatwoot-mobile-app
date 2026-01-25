import React from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import {
  WhatsAppTemplate,
  getTemplateBodyText,
  extractTemplateVariables,
  getTemplateButtons,
} from '@/types/WhatsAppTemplate';
import i18n from '@/i18n';

interface TemplateItemProps {
  template: WhatsAppTemplate;
  onPress: (template: WhatsAppTemplate) => void;
}

export const TemplateItem = ({ template, onPress }: TemplateItemProps) => {
  const { colors, isDark } = useThemeContext();
  
  const bodyText = getTemplateBodyText(template);
  const variables = extractTemplateVariables(template);
  const buttons = getTemplateButtons(template);
  const hasVariables = variables.length > 0;
  
  // Truncate body text for preview
  const previewText = bodyText.length > 120 ? `${bodyText.substring(0, 120)}...` : bodyText;
  
  // Format template name for display
  const displayName = template.name.replace(/_/g, ' ');
  
  // Category badge color
  const getCategoryColor = () => {
    switch (template.category) {
      case 'UTILITY':
        return isDark ? 'bg-green-900' : 'bg-green-100';
      case 'MARKETING':
        return isDark ? 'bg-blue-900' : 'bg-blue-100';
      case 'AUTHENTICATION':
        return isDark ? 'bg-amber-900' : 'bg-amber-100';
      default:
        return isDark ? 'bg-gray-800' : 'bg-gray-100';
    }
  };
  
  const getCategoryTextColor = () => {
    switch (template.category) {
      case 'UTILITY':
        return isDark ? 'text-green-300' : 'text-green-800';
      case 'MARKETING':
        return isDark ? 'text-blue-300' : 'text-blue-800';
      case 'AUTHENTICATION':
        return isDark ? 'text-amber-300' : 'text-amber-800';
      default:
        return isDark ? 'text-gray-300' : 'text-gray-800';
    }
  };

  return (
    <Pressable
      onPress={() => onPress(template)}
      style={({ pressed }) => [
        tailwind.style(
          'px-4 py-3 border-b',
          isDark ? 'border-gray-800' : 'border-gray-200',
          pressed && (isDark ? 'bg-gray-900' : 'bg-gray-50'),
        ),
      ]}>
      {/* Header: Name + Category Badge */}
      <View style={tailwind.style('flex-row items-center justify-between mb-2')}>
        <Animated.Text
          numberOfLines={1}
          style={tailwind.style(
            'flex-1 text-md font-inter-medium-24 capitalize',
            isDark ? 'text-gray-100' : 'text-gray-900',
          )}>
          {displayName}
        </Animated.Text>
        <View style={tailwind.style('flex-row items-center ml-2')}>
          {hasVariables ? (
            <View
              style={tailwind.style(
                'px-2 py-0.5 rounded mr-2',
                isDark ? 'bg-amber-900' : 'bg-amber-100',
              )}>
              <Animated.Text
                style={tailwind.style(
                  'text-xs font-inter-420-20',
                  isDark ? 'text-amber-300' : 'text-amber-800',
                )}>
                {`${variables.length} ${variables.length === 1 ? i18n.t('WHATSAPP_TEMPLATES.VARIABLE') : i18n.t('WHATSAPP_TEMPLATES.VARIABLES')}`}
              </Animated.Text>
            </View>
          ) : null}
          <View style={tailwind.style('px-2 py-0.5 rounded', getCategoryColor())}>
            <Animated.Text
              style={tailwind.style('text-xs font-inter-420-20', getCategoryTextColor())}>
              {template.category}
            </Animated.Text>
          </View>
        </View>
      </View>
      
      {/* Body Preview */}
      <Animated.Text
        numberOfLines={3}
        style={tailwind.style(
          'text-sm font-inter-normal-20 leading-5',
          isDark ? 'text-gray-400' : 'text-gray-600',
        )}>
        {previewText}
      </Animated.Text>
      
      {/* Buttons Preview */}
      {buttons.length > 0 ? (
        <View style={tailwind.style('flex-row flex-wrap mt-2 gap-1')}>
          {buttons.slice(0, 3).map((button, index) => (
            <View
              key={index}
              style={tailwind.style(
                'px-2 py-1 rounded-md border',
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50',
              )}>
              <Animated.Text
                numberOfLines={1}
                style={tailwind.style(
                  'text-xs font-inter-420-20',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}>
                {button.text}
              </Animated.Text>
            </View>
          ))}
          {buttons.length > 3 ? (
            <Animated.Text
              style={tailwind.style(
                'text-xs font-inter-420-20 self-center ml-1',
                isDark ? 'text-gray-500' : 'text-gray-500',
              )}>
              {`+${buttons.length - 3}`}
            </Animated.Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
};
