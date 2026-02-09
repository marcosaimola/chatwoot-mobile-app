import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Contact } from '@/types';
import { ContactConversationService, UpdateContactPayload } from '@/services/ContactConversationService';
import { showToast } from '@/utils/toastUtils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateContact as updateContactInStore } from '@/store/contact/contactSlice';
import { updateConversationContact } from '@/store/conversation/conversationSlice';
import i18n from '@/i18n';
import { getContactCustomAttributes } from '@/store/custom-attribute/customAttributeSlice';
import { ContactCustomAttributesForm } from './ContactCustomAttributesForm';
import type { CustomAttribute } from '@/types';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convert DD/MM/YYYY to ISO string for API. Returns original value if not in expected format. */
function ddmmyyyyToISO(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return value; // Already ISO or other format, return as is
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

/** Build form values from contact customAttributes, supporting both camelCase and snake_case keys.
 * def.attributeKey is the original snake_case key (e.g. "waha_whatsapp_jid").
 * After transformContact, contact.customAttributes keys are in camelCase (e.g. "wahaWhatsappJid").
 */
function customAttributesForForm(
  contactAttrs: Record<string, unknown> | undefined,
  definitions: CustomAttribute[],
): Record<string, unknown> {
  if (!contactAttrs || !Object.keys(contactAttrs).length) return {};
  const out: Record<string, unknown> = {};
  for (const def of definitions) {
    const snakeKey = def.attributeKey; // original key from API definition (snake_case)
    const camelKey = snakeToCamel(snakeKey); // converted to camelCase
    // Try both snake_case (from searchContacts) and camelCase (from getContact/transformContact)
    const value = contactAttrs[snakeKey] ?? contactAttrs[camelKey];
    if (value !== undefined && value !== null && value !== '') {
      // Store with the original snake_case key to match definitions
      out[snakeKey] = value;
    }
  }
  return out;
}

interface ContactEditFormProps {
  contact: Contact;
  onSave: (updatedContact: Contact) => void;
  onCancel: () => void;
}

interface FormField {
  label: string;
  key: keyof FormData;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  city: string;
  country: string;
  description: string;
}

export const ContactEditForm = ({ contact, onSave, onCancel }: ContactEditFormProps) => {
  const { isDark, colors } = useThemeContext();
  const { bottom } = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const contactAttributeDefinitions = useAppSelector(getContactCustomAttributes);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: contact.name || '',
    email: contact.email || '',
    phoneNumber: contact.phoneNumber || '',
    companyName: contact.additionalAttributes?.companyName || '',
    city: contact.additionalAttributes?.city || '',
    country: contact.additionalAttributes?.country || '',
    description: contact.additionalAttributes?.description || '',
  });

  const [customAttributesFormValues, setCustomAttributesFormValues] = useState<Record<string, unknown>>(
    () => customAttributesForForm(contact.customAttributes, contactAttributeDefinitions),
  );

  useEffect(() => {
    setCustomAttributesFormValues(
      customAttributesForForm(contact.customAttributes, contactAttributeDefinitions),
    );
  }, [contact.id, contact.customAttributes, contactAttributeDefinitions]);

  const updateField = useCallback((key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleDeleteAttribute = useCallback(
    async (attributeKey: string) => {
      try {
        const result = await ContactConversationService.destroyCustomAttributes(contact.id, [
          attributeKey,
        ]);

        // Update local form state
        setCustomAttributesFormValues(prev => {
          const updated = { ...prev };
          delete updated[attributeKey];
          return updated;
        });

        // Update Redux store with new contact data
        dispatch(updateContactInStore(result.contact));
        dispatch(updateConversationContact(result.contact));

        showToast({
          message: i18n.t('CONTACT_ATTRIBUTES.DELETE_SUCCESS'),
        });
      } catch (error) {
        showToast({
          message: i18n.t('CONTACT_ATTRIBUTES.DELETE_ERROR'),
        });
      }
    },
    [contact.id, dispatch],
  );

  const handleSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const mergedCustomAttributes: Record<string, unknown> = {};
      const existingCustom = contact.customAttributes || {};
      const definitionByKey = new Map(
        contactAttributeDefinitions.map(def => [def.attributeKey, def]),
      );

      Object.keys(existingCustom).forEach(key => {
        const value = existingCustom[key];
        if (value !== undefined && value !== null && value !== '') {
          mergedCustomAttributes[key] = value;
        }
      });

      Object.keys(customAttributesFormValues).forEach(key => {
        let value = customAttributesFormValues[key];
        if (value === undefined) return;
        const def = definitionByKey.get(key);
        if (def?.attributeDisplayType === 'number' && value !== '' && value !== null) {
          const num = Number(value);
          value = Number.isNaN(num) ? value : num;
        }
        if (def?.attributeDisplayType === 'checkbox') {
          value = value === true || value === 'true' || value === 1 || value === '1' || value === 'yes';
        }
        if (def?.attributeDisplayType === 'date') {
          value = ddmmyyyyToISO(value);
        }
        mergedCustomAttributes[key] = value;
      });

      // Keys are already in snake_case (from definitions), no need to convert
      const customAttributesForApi = mergedCustomAttributes;

      const payload: UpdateContactPayload = {
        name: formData.name || undefined,
        email: formData.email || null,
        phone_number: formData.phoneNumber || undefined,
        additional_attributes: {
          description: formData.description || '',
          company_name: formData.companyName || '',
          city: formData.city || '',
          country: formData.country || '',
        },
        custom_attributes: customAttributesForApi,
      };

      const result = await ContactConversationService.updateContact(contact.id, payload);
      
      // Update contact in Redux store (contacts slice)
      dispatch(updateContactInStore(result.contact));
      
      // Update contact in all conversations that have this contact as sender
      dispatch(updateConversationContact({
        contactId: contact.id,
        contact: result.contact,
      }));
      
      showToast({ message: i18n.t('CONTACT_EDIT.SUCCESS') });
      onSave(result.contact);
    } catch (error) {
      showToast({ message: i18n.t('CONTACT_EDIT.ERROR') });
    } finally {
      setIsLoading(false);
    }
  }, [contact.id, contact.customAttributes, customAttributesFormValues, formData, dispatch, onSave, isLoading]);

  const formFields: FormField[] = [
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.NAME'),
      key: 'name',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.NAME'),
      autoCapitalize: 'words',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.EMAIL'),
      key: 'email',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.EMAIL'),
      keyboardType: 'email-address',
      autoCapitalize: 'none',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.PHONE'),
      key: 'phoneNumber',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.PHONE'),
      keyboardType: 'phone-pad',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.COMPANY'),
      key: 'companyName',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.COMPANY'),
      autoCapitalize: 'words',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.CITY'),
      key: 'city',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.CITY'),
      autoCapitalize: 'words',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.COUNTRY'),
      key: 'country',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.COUNTRY'),
      autoCapitalize: 'words',
    },
    {
      label: i18n.t('CONTACT_EDIT.FIELDS.BIO'),
      key: 'description',
      placeholder: i18n.t('CONTACT_EDIT.PLACEHOLDERS.BIO'),
      autoCapitalize: 'sentences',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tailwind.style('flex-1')}>
      <ScrollView
        style={tailwind.style('flex-1')}
        contentContainerStyle={tailwind.style('px-4 pt-4', `pb-[${bottom + 100}px]`)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {formFields.map(field => (
          <View key={field.key} style={tailwind.style('mb-4')}>
            <Animated.Text
              style={tailwind.style(
                'text-sm font-inter-medium-24 mb-2',
                isDark ? 'text-gray-300' : 'text-gray-700',
              )}>
              {field.label}
            </Animated.Text>
            <TextInput
              value={formData[field.key]}
              onChangeText={value => updateField(field.key, value)}
              placeholder={field.placeholder}
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              keyboardType={field.keyboardType || 'default'}
              autoCapitalize={field.autoCapitalize || 'sentences'}
              editable={!isLoading}
              style={[
                tailwind.style(
                  'px-4 py-3 rounded-xl text-md font-inter-normal-20',
                  isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-200',
                  'border',
                ),
              ]}
            />
          </View>
        ))}

        {contactAttributeDefinitions.length ? (
          <View style={tailwind.style('mt-6')}>
            <Animated.Text
              style={tailwind.style(
                'text-base font-inter-semibold-20 mb-3',
                isDark ? 'text-gray-300' : 'text-gray-700',
              )}>
              {i18n.t('CONTACT_ATTRIBUTES.SECTION_TITLE')}
            </Animated.Text>
            <ContactCustomAttributesForm
              definitions={contactAttributeDefinitions}
              values={customAttributesFormValues}
              onChange={(key, value) =>
                setCustomAttributesFormValues(prev => ({
                  ...prev,
                  [key]: value,
                }))
              }
              onDelete={handleDeleteAttribute}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Save Button */}
      <View
        style={tailwind.style(
          'px-4 py-3',
          isDark ? 'border-t border-gray-800' : 'border-t border-gray-200',
          `pb-[${bottom + 12}px]`,
        )}>
        <Pressable
          onPress={handleSave}
          disabled={isLoading}
          style={({ pressed }) => [
            tailwind.style(
              'py-3 rounded-xl items-center flex-row justify-center',
              'bg-blue-600',
              pressed && 'bg-blue-700',
              isLoading && 'opacity-70',
            ),
          ]}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={tailwind.style('mr-2')} />
          ) : null}
          <Animated.Text style={tailwind.style('text-md font-inter-medium-24 text-white')}>
            {isLoading ? i18n.t('CONTACT_EDIT.SAVING') : i18n.t('CONTACT_EDIT.SAVE')}
          </Animated.Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
