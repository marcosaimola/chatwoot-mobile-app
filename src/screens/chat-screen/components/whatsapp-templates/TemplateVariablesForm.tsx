import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import {
  WhatsAppTemplate,
  TemplateVariable,
  extractTemplateVariables,
  getTemplateBodyText,
  getTemplateHeaderText,
  getTemplateFooterText,
  getTemplateButtons,
  replaceTemplateVariables,
} from '@/types/WhatsAppTemplate';
import i18n from '@/i18n';

interface TemplateVariablesFormProps {
  template: WhatsAppTemplate;
  contactName: string;
  onSubmit: (variables: Record<string, string>) => void;
  onCancel: () => void;
}

export const TemplateVariablesForm = ({
  template,
  contactName,
  onSubmit,
  onCancel,
}: TemplateVariablesFormProps) => {
  const { colors, isDark } = useThemeContext();
  
  const variables = extractTemplateVariables(template);
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewText, setPreviewText] = useState('');
  
  // Initialize values with examples if available
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach(variable => {
      initialValues[variable.index.toString()] = '';
    });
    setValues(initialValues);
  }, [template]);
  
  // Update preview when values change
  useEffect(() => {
    const bodyText = getTemplateBodyText(template);
    const preview = replaceTemplateVariables(bodyText, values);
    setPreviewText(preview);
  }, [values, template]);
  
  const handleValueChange = (index: string, value: string) => {
    setValues(prev => ({ ...prev, [index]: value }));
  };
  
  const isFormValid = () => {
    return variables.every(v => values[v.index.toString()]?.trim().length > 0);
  };
  
  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(values);
    }
  };
  
  const headerText = getTemplateHeaderText(template);
  const footerText = getTemplateFooterText(template);
  const buttons = getTemplateButtons(template);
  const displayName = template.name.replace(/_/g, ' ');

  return (
    <View style={tailwind.style('flex-1')}>
      {/* Header */}
      <View
        style={tailwind.style(
          'px-4 py-3 border-b',
          isDark ? 'border-gray-800' : 'border-gray-200',
        )}>
        <Animated.Text
          style={tailwind.style(
            'text-lg font-inter-semibold-20 text-center capitalize',
            isDark ? 'text-gray-100' : 'text-gray-900',
          )}>
          {displayName}
        </Animated.Text>
        {contactName ? (
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24 text-center mt-1',
              isDark ? 'text-blue-400' : 'text-blue-600',
            )}>
            {contactName}
          </Animated.Text>
        ) : null}
        <Animated.Text
          style={tailwind.style(
            'text-sm font-inter-normal-20 text-center mt-1',
            isDark ? 'text-gray-400' : 'text-gray-600',
          )}>
          {i18n.t('WHATSAPP_TEMPLATES.FILL_VARIABLES')}
        </Animated.Text>
      </View>
      
      <ScrollView
        style={tailwind.style('flex-1')}
        contentContainerStyle={tailwind.style('px-4 py-4')}
        keyboardShouldPersistTaps="handled">
        
        {/* Variables Input */}
        <View style={tailwind.style('mb-4')}>
          <Animated.Text
            style={tailwind.style(
              'text-sm font-inter-medium-24 mb-2',
              isDark ? 'text-gray-300' : 'text-gray-700',
            )}>
            {i18n.t('WHATSAPP_TEMPLATES.VARIABLES_SECTION')}
          </Animated.Text>
          
          {variables.map((variable, index) => (
            <View key={variable.index} style={tailwind.style('mb-3')}>
              <Animated.Text
                style={tailwind.style(
                  'text-xs font-inter-420-20 mb-1',
                  isDark ? 'text-gray-400' : 'text-gray-600',
                )}>
                {`${i18n.t('WHATSAPP_TEMPLATES.VARIABLE')} ${variable.index}`}
                {variable.example ? (
                  <Animated.Text style={tailwind.style('text-gray-500')}>
                    {` (${i18n.t('WHATSAPP_TEMPLATES.EXAMPLE')}: ${variable.example})`}
                  </Animated.Text>
                ) : null}
              </Animated.Text>
              <TextInput
                value={values[variable.index.toString()] || ''}
                onChangeText={text => handleValueChange(variable.index.toString(), text)}
                placeholder={variable.example || `${i18n.t('WHATSAPP_TEMPLATES.ENTER_VALUE')} ${variable.index}`}
                placeholderTextColor={tailwind.color(isDark ? 'text-gray-600' : 'text-gray-400')}
                style={[
                  tailwind.style(
                    'px-3 py-2.5 rounded-lg text-md font-inter-normal-20',
                    isDark ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-300',
                    'border',
                  ),
                ]}
              />
            </View>
          ))}
        </View>
        
        {/* Preview Section */}
        <View style={tailwind.style('mb-4')}>
          <Animated.Text
            style={tailwind.style(
              'text-sm font-inter-medium-24 mb-2',
              isDark ? 'text-gray-300' : 'text-gray-700',
            )}>
            {i18n.t('WHATSAPP_TEMPLATES.PREVIEW')}
          </Animated.Text>
          
          <View
            style={tailwind.style(
              'p-3 rounded-lg border',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
            )}>
            {/* Header Preview */}
            {headerText ? (
              <Animated.Text
                style={tailwind.style(
                  'text-md font-inter-semibold-20 mb-2',
                  isDark ? 'text-gray-100' : 'text-gray-900',
                )}>
                {replaceTemplateVariables(headerText, values)}
              </Animated.Text>
            ) : null}
            
            {/* Body Preview */}
            <Animated.Text
              style={tailwind.style(
                'text-sm font-inter-normal-20 leading-5',
                isDark ? 'text-gray-300' : 'text-gray-700',
              )}>
              {previewText}
            </Animated.Text>
            
            {/* Footer Preview */}
            {footerText ? (
              <Animated.Text
                style={tailwind.style(
                  'text-xs font-inter-420-20 mt-2',
                  isDark ? 'text-gray-500' : 'text-gray-500',
                )}>
                {footerText}
              </Animated.Text>
            ) : null}
            
            {/* Buttons Preview */}
            {buttons.length > 0 ? (
              <View style={tailwind.style('flex-row flex-wrap mt-3 gap-2')}>
                {buttons.map((button, idx) => (
                  <View
                    key={idx}
                    style={tailwind.style(
                      'px-3 py-1.5 rounded-lg border',
                      isDark ? 'border-blue-700 bg-blue-900/30' : 'border-blue-300 bg-blue-50',
                    )}>
                    <Animated.Text
                      style={tailwind.style(
                        'text-xs font-inter-medium-24',
                        isDark ? 'text-blue-300' : 'text-blue-700',
                      )}>
                      {button.text}
                    </Animated.Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View
        style={tailwind.style(
          'flex-row px-4 py-3 border-t gap-3',
          isDark ? 'border-gray-800' : 'border-gray-200',
        )}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            tailwind.style(
              'flex-1 py-3 rounded-xl items-center justify-center border',
              isDark ? 'border-gray-700' : 'border-gray-300',
              pressed && (isDark ? 'bg-gray-800' : 'bg-gray-100'),
            ),
          ]}>
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24',
              isDark ? 'text-gray-300' : 'text-gray-700',
            )}>
            {i18n.t('WHATSAPP_TEMPLATES.CANCEL')}
          </Animated.Text>
        </Pressable>
        
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid()}
          style={({ pressed }) => [
            tailwind.style(
              'flex-1 py-3 rounded-xl items-center justify-center',
              isFormValid()
                ? isDark ? 'bg-blue-700' : 'bg-blue-600'
                : isDark ? 'bg-gray-800' : 'bg-gray-200',
              pressed && isFormValid() && (isDark ? 'bg-blue-800' : 'bg-blue-700'),
            ),
          ]}>
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24',
              isFormValid() ? 'text-white' : isDark ? 'text-gray-600' : 'text-gray-400',
            )}>
            {i18n.t('WHATSAPP_TEMPLATES.SEND')}
          </Animated.Text>
        </Pressable>
      </View>
    </View>
  );
};
