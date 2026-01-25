import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, Keyboard, ScrollView, Modal, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Icon } from '@/components-next/common';
import { SearchIcon, FileIcon } from '@/svg-icons';
import {
  WhatsAppTemplate,
  isTemplateAvailable,
  extractTemplateVariables,
  getTemplateBodyText,
  replaceTemplateVariables,
  WhatsAppTemplateParams,
} from '@/types/WhatsAppTemplate';
import { TemplateItem } from './TemplateItem';
import { TemplateVariablesForm } from './TemplateVariablesForm';
import i18n from '@/i18n';

export interface TemplateListSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface TemplateListSheetProps {
  templates: WhatsAppTemplate[];
  contactName: string;
  onSendTemplate: (templateParams: WhatsAppTemplateParams, messageContent: string) => void;
}

export const TemplateListSheet = forwardRef<TemplateListSheetHandle, TemplateListSheetProps>(
  ({ templates, contactName, onSendTemplate }, ref) => {
    const { isDark } = useThemeContext();
    const { bottom } = useSafeAreaInsets();

    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

    useImperativeHandle(ref, () => ({
      present: () => setIsVisible(true),
      dismiss: () => {
        setIsVisible(false);
        setSelectedTemplate(null);
        setSearchQuery('');
      },
    }));

    // Filter templates: only approved, no media, matching search
    const availableTemplates = useMemo(() => {
      return templates
        .filter(isTemplateAvailable)
        .filter(template => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          const name = template.name.toLowerCase().replace(/_/g, ' ');
          const body = getTemplateBodyText(template).toLowerCase();
          return name.includes(query) || body.includes(query);
        });
    }, [templates, searchQuery]);

    const handleTemplatePress = useCallback((template: WhatsAppTemplate) => {
      const variables = extractTemplateVariables(template);

      if (variables.length > 0) {
        setSelectedTemplate(template);
      } else {
        sendTemplate(template, {});
      }
    }, []);

    const sendTemplate = useCallback(
      (template: WhatsAppTemplate, variables: Record<string, string>) => {
        const bodyText = getTemplateBodyText(template);
        const messageContent = replaceTemplateVariables(bodyText, variables);

        const templateParams: WhatsAppTemplateParams = {
          name: template.name,
          category: template.category,
          language: template.language,
          processed_params:
            Object.keys(variables).length > 0 ? { body: variables } : undefined,
        };

        onSendTemplate(templateParams, messageContent);
        handleDismiss();
      },
      [onSendTemplate],
    );

    const handleVariablesSubmit = useCallback(
      (variables: Record<string, string>) => {
        if (selectedTemplate) {
          sendTemplate(selectedTemplate, variables);
        }
      },
      [selectedTemplate, sendTemplate],
    );

    const handleBack = useCallback(() => {
      setSelectedTemplate(null);
    }, []);

    const handleDismiss = useCallback(() => {
      setIsVisible(false);
      setSelectedTemplate(null);
      setSearchQuery('');
    }, []);

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleDismiss}
      >
        <View style={tailwind.style('flex-1', isDark ? 'bg-gray-950' : 'bg-white')}>
          {/* Handle indicator */}
          <View style={tailwind.style('items-center pt-2 pb-1')}>
            <View
              style={tailwind.style(
                'w-8 h-1 rounded-full',
                isDark ? 'bg-gray-600' : 'bg-gray-300',
              )}
            />
          </View>

          {selectedTemplate ? (
            // Variables Form View
            <View style={tailwind.style('flex-1')}>
              {/* Header with back button */}
              <View style={tailwind.style('px-4 py-2')}>
                <Pressable onPress={handleBack}>
                  <Animated.Text
                    style={tailwind.style(
                      'text-md font-inter-medium-24',
                      isDark ? 'text-blue-400' : 'text-blue-600',
                    )}
                  >
                    {`← ${i18n.t('WHATSAPP_TEMPLATES.BACK')}`}
                  </Animated.Text>
                </Pressable>
              </View>

              <TemplateVariablesForm
                template={selectedTemplate}
                contactName={contactName}
                onSubmit={handleVariablesSubmit}
                onCancel={handleBack}
              />
            </View>
          ) : (
            // Template List View
            <View style={tailwind.style('flex-1')}>
              {/* Header */}
              <View style={tailwind.style('px-4 pt-1 pb-2 items-center')}>
                <Animated.Text
                  style={tailwind.style(
                    'text-lg font-inter-semibold-20',
                    isDark ? 'text-gray-100' : 'text-gray-900',
                  )}
                >
                  {i18n.t('WHATSAPP_TEMPLATES.TITLE')}
                </Animated.Text>
                {contactName ? (
                  <Animated.Text
                    style={tailwind.style(
                      'text-md font-inter-medium-24 mt-1',
                      isDark ? 'text-blue-400' : 'text-blue-600',
                    )}
                  >
                    {contactName}
                  </Animated.Text>
                ) : null}
              </View>

              {/* Search Input */}
              <View style={tailwind.style('px-4 pb-3')}>
                <View
                  style={tailwind.style(
                    'flex-row items-center px-3 rounded-xl border',
                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200',
                  )}
                >
                  <Icon
                    icon={<SearchIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />}
                    size={18}
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={i18n.t('WHATSAPP_TEMPLATES.SEARCH_PLACEHOLDER')}
                    placeholderTextColor={tailwind.color(
                      isDark ? 'text-gray-600' : 'text-gray-400',
                    )}
                    style={[
                      tailwind.style(
                        'flex-1 py-2.5 px-2 text-md font-inter-normal-20',
                        isDark ? 'text-gray-100' : 'text-gray-900',
                      ),
                    ]}
                    returnKeyType="search"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Animated.Text
                        style={tailwind.style(
                          'text-sm font-inter-medium-24 px-2',
                          isDark ? 'text-gray-400' : 'text-gray-500',
                        )}
                      >
                        {i18n.t('WHATSAPP_TEMPLATES.CLEAR')}
                      </Animated.Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Templates List */}
              {availableTemplates.length > 0 ? (
                <ScrollView
                  contentContainerStyle={{ paddingBottom: bottom + 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {availableTemplates.map(template => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onPress={handleTemplatePress}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={tailwind.style('flex-1 items-center justify-center px-4')}>
                  <Icon
                    icon={<FileIcon fill={isDark ? '#374151' : '#D1D5DB'} />}
                    size={48}
                  />
                  <Animated.Text
                    style={tailwind.style(
                      'text-md font-inter-medium-24 mt-4 text-center',
                      isDark ? 'text-gray-500' : 'text-gray-500',
                    )}
                  >
                    {searchQuery
                      ? i18n.t('WHATSAPP_TEMPLATES.NO_RESULTS')
                      : i18n.t('WHATSAPP_TEMPLATES.NO_TEMPLATES')}
                  </Animated.Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    );
  },
);
