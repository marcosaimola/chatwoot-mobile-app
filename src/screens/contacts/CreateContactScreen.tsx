import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { ContactConversationService, CreateContactPayload, UpdateContactPayload } from '@/services/ContactConversationService';
import { showToast } from '@/utils/toastUtils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { addContact } from '@/store/contact/contactSlice';
import { normalizeToE164 } from '@/utils/phoneUtils';
import { ContactsStackParamList } from '@/navigation/stack/ContactsStack';
import { contactActions } from '@/store/contact/contactActions';
import { TAB_BAR_HEIGHT } from '@/constants';
import i18n from '@/i18n';
import { getContactCustomAttributes } from '@/store/custom-attribute/customAttributeSlice';
import { ContactCustomAttributesForm } from '@/screens/contact-details/components/ContactCustomAttributesForm';

type CreateContactScreenProps = NativeStackScreenProps<ContactsStackParamList, 'CreateContactScreen'>;

interface FormField {
  label: string;
  key: keyof FormData;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  required?: boolean;
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

/**
 * Check if a contact with the given phone or email already exists
 */
async function checkDuplicateContact(
  phoneNumber: string,
  email: string,
  dispatch: ReturnType<typeof useAppDispatch>,
): Promise<boolean> {
  try {
    // Normalize phone number for comparison
    const normalizedPhone = normalizeToE164(phoneNumber);
    if (!normalizedPhone) {
      return false;
    }

    // Search by phone number
    const phoneSearchResult = await dispatch(
      contactActions.searchContacts({
        q: normalizedPhone,
        page: 1,
      }),
    ).unwrap();

    // Check if any contact matches the normalized phone
    const phoneMatch = phoneSearchResult.contacts.some(
      contact => contact.phoneNumber && normalizeToE164(contact.phoneNumber) === normalizedPhone,
    );

    if (phoneMatch) {
      return true;
    }

    // If email is provided, also search by email
    if (email && email.trim()) {
      const emailSearchResult = await dispatch(
        contactActions.searchContacts({
          q: email.trim(),
          page: 1,
        }),
      ).unwrap();

      const emailMatch = emailSearchResult.contacts.some(
        contact => contact.email && contact.email.toLowerCase() === email.toLowerCase().trim(),
      );

      if (emailMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // If search fails, don't block creation - just log and continue
    console.warn('Error checking for duplicate contact:', error);
    return false;
  }
}

const CreateContactScreen = ({ navigation }: CreateContactScreenProps) => {
  const { isDark, colors } = useThemeContext();
  const { bottom } = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const contactAttributeDefinitions = useAppSelector(getContactCustomAttributes);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    city: '',
    country: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [customAttributesFormValues, setCustomAttributesFormValues] = useState<Record<string, unknown>>({});

  const updateField = useCallback((key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefone é obrigatório';
    } else {
      const normalized = normalizeToE164(formData.phoneNumber);
      if (!normalized) {
        newErrors.phoneNumber = 'Telefone inválido';
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (isLoading) return;

    if (!validateForm()) {
      showToast({ message: 'Por favor, preencha todos os campos obrigatórios corretamente' });
      return;
    }

    setIsLoading(true);

    try {
      // Normalize phone number to E.164
      const normalizedPhone = normalizeToE164(formData.phoneNumber);
      if (!normalizedPhone) {
        showToast({ message: 'Telefone inválido' });
        setIsLoading(false);
        return;
      }

      // Check for duplicates
      const isDuplicate = await checkDuplicateContact(normalizedPhone, formData.email, dispatch);
      if (isDuplicate) {
        showToast({ message: 'Já existe um contato com este telefone ou email' });
        setIsLoading(false);
        return;
      }

      // Create contact with minimal payload (as per API spec: name, phone_number)
      const payload: CreateContactPayload = {
        name: formData.name.trim(),
        phone_number: normalizedPhone,
        email: formData.email?.trim() || null,
      };

      const result = await ContactConversationService.createContact(payload);

      const hasAdditionalFields =
        !!formData.companyName || !!formData.city || !!formData.country || !!formData.description;

      const hasCustomAttributes = Object.keys(customAttributesFormValues).length > 0;

      if (hasAdditionalFields || hasCustomAttributes) {
        try {
          const updatePayload: UpdateContactPayload = {};

          if (hasAdditionalFields) {
            updatePayload.additional_attributes = {
              company_name: formData.companyName || '',
              city: formData.city || '',
              country: formData.country || '',
              description: formData.description || '',
            };
          }

          if (hasCustomAttributes) {
            const definitionByKey = new Map(
              contactAttributeDefinitions.map(def => [def.attributeKey, def]),
            );
            const prepared: Record<string, unknown> = {};
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
              if (def?.attributeDisplayType === 'date' && typeof value === 'string') {
                // Convert DD/MM/YYYY to ISO
                const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
                if (match) {
                  const [, day, month, year] = match;
                  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
                  if (!Number.isNaN(date.getTime())) {
                    value = date.toISOString();
                  }
                }
              }
              prepared[key] = value;
            });
            // Keys are already in snake_case (from definitions)
            updatePayload.custom_attributes = prepared;
          }

          const updatedResult = await ContactConversationService.updateContact(
            result.contact.id,
            updatePayload,
          );
          // Add updated contact to Redux store
          dispatch(addContact(updatedResult.contact));
        } catch (updateError) {
          // Contact was created, but update failed - not critical
          // Add the basic contact anyway
          dispatch(addContact(result.contact));
          console.warn('Failed to update contact fields:', updateError);
        }
      } else {
        // Add contact to Redux store
        dispatch(addContact(result.contact));
      }

      showToast({ message: 'Contato criado com sucesso' });
      
      // Navigate to contact details or back to list
      navigation.navigate('ContactsScreen');
    } catch (error) {
      console.error('Error creating contact:', error);
      showToast({ message: 'Erro ao criar contato. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, dispatch, navigation, isLoading, validateForm]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const formFields: FormField[] = [
    {
      label: 'Nome *',
      key: 'name',
      placeholder: 'Nome do contato',
      autoCapitalize: 'words',
      required: true,
    },
    {
      label: 'Telefone *',
      key: 'phoneNumber',
      placeholder: '+55 11 99999-9999',
      keyboardType: 'phone-pad',
      required: true,
    },
    {
      label: 'Email',
      key: 'email',
      placeholder: 'email@exemplo.com',
      keyboardType: 'email-address',
      autoCapitalize: 'none',
    },
    {
      label: 'Empresa',
      key: 'companyName',
      placeholder: 'Nome da empresa',
      autoCapitalize: 'words',
    },
    {
      label: 'Cidade',
      key: 'city',
      placeholder: 'Cidade',
      autoCapitalize: 'words',
    },
    {
      label: 'País',
      key: 'country',
      placeholder: 'País',
      autoCapitalize: 'words',
    },
    {
      label: 'Descrição',
      key: 'description',
      placeholder: 'Descrição ou observações',
      autoCapitalize: 'sentences',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={tailwind.style(`flex-1 ${colors.bgPrimary}`)}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color(colors.statusBarBg)}
        barStyle={colors.statusBarStyle}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tailwind.style('flex-1')}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {/* Header */}
        <Animated.View
          style={tailwind.style(
            'flex-row items-center justify-between px-4 py-3',
            `border-b-[1px] ${colors.borderPrimary}`,
          )}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Animated.Text
              style={tailwind.style(
                'text-md font-inter-medium-24',
                colors.textPrimary,
              )}>
              Cancelar
            </Animated.Text>
          </Pressable>
          <Animated.Text
            style={tailwind.style(
              'text-md font-inter-medium-24',
              colors.textPrimary,
            )}>
            Novo Contato
          </Animated.Text>
          <View style={tailwind.style('w-16')} />
        </Animated.View>

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
                  errors[field.key] && tailwind.style('border-red-500'),
                ]}
              />
              {errors[field.key] && (
                <Animated.Text
                  style={tailwind.style('text-xs text-red-500 mt-1')}>
                  {errors[field.key]}
                </Animated.Text>
              )}
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
              />
            </View>
          ) : null}
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={[
            tailwind.style(
              'flex-row px-4 py-3 gap-3',
              `border-t-[1px] ${colors.borderPrimary}`,
              colors.bgPrimary,
            ),
            { paddingBottom: Math.max(bottom + TAB_BAR_HEIGHT, 12) },
          ]}>
          <Pressable
            onPress={handleCancel}
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
              Cancelar
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
              {isLoading ? 'Criando...' : 'Criar'}
            </Animated.Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateContactScreen;
