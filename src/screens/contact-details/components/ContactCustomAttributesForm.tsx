import React, { useMemo, useState, useCallback } from 'react';
import { View, TextInput, Pressable, Switch, Modal, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { CustomAttribute } from '@/types';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import i18n from '@/i18n';
import { CloseIcon } from '@/svg-icons';
import { Icon } from '@/components-next/common';

const DDMMYYYY_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

function formatDateToDDMMYYYY(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDDMMYYYY(str: string): Date | null {
  if (!str || !DDMMYYYY_REGEX.test(str.trim())) return null;
  const [day, month, year] = str.trim().split('/').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/** Normalize API date (e.g. YYYY-MM-DD) to DD/MM/AAAA for display. */
function normalizeDateDisplay(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return '';
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }
  if (DDMMYYYY_REGEX.test(s)) return s;
  return s;
}

interface ContactCustomAttributesFormProps {
  definitions: CustomAttribute[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onDelete?: (key: string) => void;
}

type SupportedDisplayType = 'text' | 'number' | 'checkbox' | 'list' | 'date' | 'link';

const SUPPORTED_TYPES: SupportedDisplayType[] = ['text', 'number', 'checkbox', 'list', 'date', 'link'];

export const ContactCustomAttributesForm = ({
  definitions,
  values,
  onChange,
  onDelete,
}: ContactCustomAttributesFormProps) => {
  const { isDark } = useThemeContext();
  const [openListKey, setOpenListKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const filteredDefinitions = useMemo(
    () =>
      definitions.filter(def =>
        SUPPORTED_TYPES.includes(def.attributeDisplayType as SupportedDisplayType),
      ),
    [definitions],
  );

  const setError = useCallback((key: string, message?: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [key]: message,
    }));
  }, []);

  const handleTextChange = (key: string, value: string) => {
    onChange(key, value);
  };

  const handleLinkChange = (key: string, value: string) => {
    onChange(key, value);

    if (!value) {
      setError(key);
      return;
    }

    const isValid = /^https?:\/\//i.test(value.trim());
    setError(key, isValid ? undefined : i18n.t('CONTACT_ATTRIBUTES.URL_INVALID'));
  };

  const [datePickerKey, setDatePickerKey] = useState<string | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  const handleDateFieldPress = useCallback(
    (key: string) => {
      const current = values[key];
      const str = typeof current === 'string' ? current : '';
      let parsed = parseDDMMYYYY(str);
      if (!parsed && str) {
        const iso = /^\d{4}-\d{2}-\d{2}/.test(str) ? new Date(str) : null;
        if (iso && !Number.isNaN(iso.getTime())) parsed = iso;
      }
      const initial = parsed || new Date();
      setDatePickerValue(initial);
      setDatePickerKey(key);

      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: initial,
          mode: 'date',
          onChange: (_event, selectedDate) => {
            if (selectedDate) {
              onChange(key, formatDateToDDMMYYYY(selectedDate));
              setError(key);
            }
            setDatePickerKey(null);
          },
        });
      }
    },
    [onChange, setError, values],
  );

  const handleDatePickerConfirm = useCallback(() => {
    if (datePickerKey) {
      onChange(datePickerKey, formatDateToDDMMYYYY(datePickerValue));
      setError(datePickerKey);
      setDatePickerKey(null);
    }
  }, [datePickerKey, datePickerValue, onChange, setError]);

  const handleCheckboxToggle = (key: string, rawValue: unknown) => {
    const current =
      rawValue === true ||
      rawValue === 'true' ||
      rawValue === 1 ||
      rawValue === '1' ||
      rawValue === 'yes';
    const next = !current;
    onChange(key, next);
  };

  const toggleListOpen = (key: string) => {
    setOpenListKey(prev => (prev === key ? null : key));
  };

  const handleListSelect = (key: string, option: string) => {
    onChange(key, option);
    setOpenListKey(null);
  };

  if (!filteredDefinitions.length) {
    return null;
  }

  return (
    <View style={tailwind.style('mt-2')}>
      {filteredDefinitions.map(definition => {
        const key = definition.attributeKey;
        const type = definition.attributeDisplayType as SupportedDisplayType;
        const value = values[key];
        const stringValue = value !== undefined && value !== null ? String(value) : '';
        const errorMessage = fieldErrors[key];

        const hasValue = value !== undefined && value !== null && value !== '' && value !== false;

        return (
          <View key={key} style={tailwind.style('mb-4')}>
            <View style={tailwind.style('flex-row justify-between items-center mb-2')}>
              <Animated.Text
                style={tailwind.style(
                  'text-sm font-inter-medium-24',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}>
                {definition.attributeDisplayName}
              </Animated.Text>
              {hasValue && onDelete && (
                <Pressable
                  hitSlop={12}
                  onPress={() => onDelete(key)}
                  style={tailwind.style('p-1')}>
                  <Icon
                    icon={<CloseIcon stroke={isDark ? '#EF4444' : '#DC2626'} />}
                    size={16}
                  />
                </Pressable>
              )}
            </View>

            {(type === 'text' || type === 'number') && (
              <TextInput
                value={stringValue}
                onChangeText={text => handleTextChange(key, text)}
                placeholder={definition.attributeDescription || definition.attributeDisplayName}
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                keyboardType={type === 'number' ? 'numeric' : 'default'}
                autoCapitalize="sentences"
                style={tailwind.style(
                  'px-4 py-3 rounded-xl text-md font-inter-normal-20 border',
                  isDark
                    ? 'bg-gray-900 text-white border-gray-700'
                    : 'bg-gray-100 text-gray-900 border-gray-200',
                )}
              />
            )}

            {type === 'link' && (
              <TextInput
                value={stringValue}
                onChangeText={text => handleLinkChange(key, text)}
                placeholder={definition.attributeDescription || 'https://'}
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                keyboardType="url"
                autoCapitalize="none"
                style={[
                  tailwind.style(
                    'px-4 py-3 rounded-xl text-md font-inter-normal-20 border',
                    isDark
                      ? 'bg-gray-900 text-white border-gray-700'
                      : 'bg-gray-100 text-gray-900 border-gray-200',
                  ),
                  errorMessage && tailwind.style('border-red-500'),
                ]}
              />
            )}

            {type === 'date' && (
              <View>
                <Pressable
                  onPress={() => handleDateFieldPress(key)}
                  style={({ pressed }) => [
                    tailwind.style(
                      'px-4 py-3 rounded-xl border flex-row justify-between items-center',
                      isDark
                        ? 'bg-gray-900 border-gray-700'
                        : 'bg-gray-100 border-gray-200',
                      pressed && (isDark ? 'bg-gray-800' : 'bg-gray-200'),
                    ),
                    errorMessage && tailwind.style('border-red-500'),
                  ]}>
                  <Animated.Text
                    style={tailwind.style(
                      'text-md font-inter-normal-20',
                      stringValue
                        ? isDark
                          ? 'text-gray-100'
                          : 'text-gray-900'
                        : 'text-gray-400',
                    )}>
                    {normalizeDateDisplay(value) || i18n.t('CONTACT_ATTRIBUTES.DATE_PLACEHOLDER')}
                  </Animated.Text>
                </Pressable>
                {Platform.OS === 'ios' && datePickerKey === key && (
                  <Modal transparent animationType="slide" visible>
                    <Pressable
                      style={tailwind.style('flex-1 justify-end bg-blackA-A9')}
                      onPress={() => setDatePickerKey(null)}>
                      <Pressable
                        style={tailwind.style(
                          'rounded-t-2xl p-4',
                          isDark ? 'bg-gray-900' : 'bg-white',
                        )}
                        onPress={e => e.stopPropagation()}>
                        <View style={tailwind.style('flex-row justify-end gap-2 mb-2')}>
                          <Pressable onPress={() => setDatePickerKey(null)}>
                            <Animated.Text
                              style={tailwind.style(
                                'text-md',
                                isDark ? 'text-gray-400' : 'text-gray-600',
                              )}>
                              {i18n.t('CONTACT_EDIT.CANCEL')}
                            </Animated.Text>
                          </Pressable>
                          <Pressable onPress={handleDatePickerConfirm}>
                            <Animated.Text style={tailwind.style('text-md font-inter-medium-24 text-blue-600')}>
                              {i18n.t('CONTACT_EDIT.SAVE')}
                            </Animated.Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={datePickerValue}
                          mode="date"
                          display="spinner"
                          onChange={(_event, d) => d && setDatePickerValue(d)}
                        />
                      </Pressable>
                    </Pressable>
                  </Modal>
                )}
              </View>
            )}

            {type === 'checkbox' && (
              <View
                style={tailwind.style(
                  'flex-row items-center justify-between px-4 py-3 rounded-xl border',
                  isDark
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-gray-100 border-gray-200',
                )}>
                <Animated.Text
                  style={tailwind.style(
                    'text-md font-inter-normal-20',
                    isDark ? 'text-gray-100' : 'text-gray-900',
                  )}>
                  {definition.attributeDescription || definition.attributeDisplayName}
                </Animated.Text>
                <Switch
                  value={
                    value === true ||
                    value === 'true' ||
                    value === 1 ||
                    value === '1' ||
                    value === 'yes'
                  }
                  onValueChange={() => handleCheckboxToggle(key, value)}
                />
              </View>
            )}

            {type === 'list' && (
              <View>
                <Pressable
                  onPress={() => toggleListOpen(key)}
                  style={({ pressed }) => [
                    tailwind.style(
                      'px-4 py-3 rounded-xl border flex-row justify-between items-center',
                      isDark
                        ? 'bg-gray-900 border-gray-700'
                        : 'bg-gray-100 border-gray-200',
                      pressed && (isDark ? 'bg-gray-800' : 'bg-gray-200'),
                    ),
                  ]}>
                  <Animated.Text
                    style={tailwind.style(
                      'text-md font-inter-normal-20',
                      stringValue
                        ? isDark
                          ? 'text-gray-100'
                          : 'text-gray-900'
                        : 'text-gray-400',
                    )}>
                    {stringValue || i18n.t('CONTACT_ATTRIBUTES.CHOOSE_OPTION')}
                  </Animated.Text>
                </Pressable>

                {openListKey === key && definition.attributeValues?.length ? (
                  <View
                    style={tailwind.style(
                      'mt-2 rounded-xl border',
                      isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white',
                    )}>
                    {definition.attributeValues.map(option => {
                      const isSelected = option === stringValue;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => handleListSelect(key, option)}
                          style={({ pressed }) => [
                            tailwind.style(
                              'px-4 py-2',
                              pressed && (isDark ? 'bg-gray-800' : 'bg-gray-100'),
                              isSelected && (isDark ? 'bg-blue-900' : 'bg-blue-50'),
                            ),
                          ]}>
                          <Animated.Text
                            style={tailwind.style(
                              'text-md font-inter-normal-20',
                              isSelected
                                ? 'text-blue-600'
                                : isDark
                                  ? 'text-gray-100'
                                  : 'text-gray-900',
                            )}>
                            {option}
                          </Animated.Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            )}

            {errorMessage ? (
              <Animated.Text
                style={tailwind.style('text-xs text-red-500 mt-1')}>
                {errorMessage}
              </Animated.Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

