import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Contact } from '@/types';
import { ContactConversationService, UpdateContactPayload } from '@/services/ContactConversationService';
import { showToast } from '@/utils/toastUtils';
import { useAppDispatch } from '@/hooks';
import { updateContact as updateContactInStore } from '@/store/contact/contactSlice';
import { updateConversationContact } from '@/store/conversation/conversationSlice';
import i18n from '@/i18n';

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

  const updateField = useCallback((key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
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
  }, [contact.id, formData, dispatch, onSave, isLoading]);

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
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              keyboardType={field.keyboardType || 'default'}
              autoCapitalize={field.autoCapitalize || 'sentences'}
              editable={!isLoading}
              style={[
                tailwind.style(
                  'px-4 py-3 rounded-xl text-md font-inter-normal-20',
                  isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900',
                  isDark ? 'border-gray-700' : 'border-gray-200',
                  'border',
                ),
              ]}
            />
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={tailwind.style(
          'flex-row px-4 py-3 gap-3',
          isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200',
          `pb-[${bottom + 12}px]`,
        )}>
        <Pressable
          onPress={onCancel}
          disabled={isLoading}
          style={({ pressed }) => [
            tailwind.style(
              'flex-1 py-3 rounded-xl items-center',
              isDark ? 'bg-gray-800' : 'bg-gray-100',
              pressed && (isDark ? 'bg-gray-700' : 'bg-gray-200'),
              isLoading && 'opacity-50',
            ),
          ]}>
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24',
              isDark ? 'text-gray-100' : 'text-gray-900',
            )}>
            {i18n.t('CONTACT_EDIT.CANCEL')}
          </Animated.Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={isLoading}
          style={({ pressed }) => [
            tailwind.style(
              'flex-1 py-3 rounded-xl items-center flex-row justify-center',
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
