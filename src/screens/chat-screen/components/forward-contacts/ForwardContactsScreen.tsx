import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { tailwind } from '@/theme';
import { Contact } from '@/types';
import { SearchIcon } from '@/svg-icons';
import {
  selectSelectedContactsArray,
  selectSelectedContactsCount,
  clearContactSelection,
  setForwardMessage,
  setShowInboxSelector,
} from '@/store/conversation/forwardMessageSlice';
import { contactActions } from '@/store/contact/contactActions';
import { selectContactList, selectIsLoadingContacts, selectContactListError } from '@/store/contact/contactListSelectors';
import { selectRecentContacts } from '@/store/contact/recentContactsSlice';
import i18n from '@/i18n';
import { useHaptic } from '@/utils';
import { ForwardContactItem } from './ForwardContactItem';

export const ForwardContactsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isDark } = useThemeContext();
  const { bottom, top } = useSafeAreaInsets();
  const hapticSelection = useHaptic();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [localMessage, setLocalMessage] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allContacts = useAppSelector(selectContactList);
  const isLoading = useAppSelector(selectIsLoadingContacts);
  const error = useAppSelector(selectContactListError);
  const recentContacts = useAppSelector(selectRecentContacts);
  const selectedContacts = useAppSelector(selectSelectedContactsArray);
  const selectedCount = useAppSelector(selectSelectedContactsCount);

  // Load contacts on mount
  useEffect(() => {
    dispatch(contactActions.searchContacts({ page: 1, sort: 'name' }));
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Filter out recent contacts from all contacts to avoid duplicates
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) {
      const recentIds = new Set(recentContacts.map(c => c.id));
      return allContacts.filter(c => !recentIds.has(c.id));
    }
    return allContacts;
  }, [allContacts, recentContacts, searchQuery]);

  const showRecentSection = !searchQuery.trim() && recentContacts.length > 0;

  const loadContacts = useCallback((query?: string) => {
    setIsSearching(true);
    dispatch(contactActions.searchContacts({ 
      page: 1, 
      q: query?.trim() || undefined,
      sort: 'name',
    })).finally(() => setIsSearching(false));
  }, [dispatch]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    searchTimerRef.current = setTimeout(() => {
      loadContacts(text);
    }, 500);
  }, [loadContacts]);

  const handleCancel = useCallback(() => {
    hapticSelection?.();
    dispatch(clearContactSelection());
    navigation.goBack();
  }, [dispatch, hapticSelection, navigation]);

  const handleForward = useCallback(() => {
    if (selectedCount === 0) {
      return;
    }
    hapticSelection?.();
    dispatch(setForwardMessage(localMessage));
    dispatch(setShowInboxSelector(true));
    navigation.goBack();
  }, [selectedCount, hapticSelection, dispatch, localMessage, navigation]);

  const selectedContactsText = React.useMemo(() => {
    if (selectedContacts.length === 0) return '';
    return selectedContacts
      .map(c => c.name || c.phoneNumber || c.email || '')
      .filter(Boolean)
      .join(', ');
  }, [selectedContacts]);

  const renderContact = useCallback(({ item }: { item: Contact }) => (
    <ForwardContactItem contact={item} />
  ), []);

  const keyExtractor = useCallback((item: Contact) => item.id.toString(), []);

  const ListHeaderComponent = useCallback(() => (
    <>
      {/* Recent Contacts Section */}
      {showRecentSection && (
        <>
          <Text
            style={tailwind.style(
              'text-sm font-inter-semibold-20 px-4 py-2 uppercase',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}>
            {i18n.t('FORWARD.RECENT_CONTACTS')}
          </Text>
          {recentContacts.map(contact => (
            <ForwardContactItem key={`recent-${contact.id}`} contact={contact} />
          ))}
        </>
      )}

      {/* All Contacts Section Header */}
      <Text
        style={tailwind.style(
          'text-sm font-inter-semibold-20 px-4 py-2 uppercase',
          isDark ? 'text-gray-400' : 'text-gray-500',
          showRecentSection ? 'mt-2' : '',
        )}>
        {searchQuery.trim() 
          ? i18n.t('FORWARD.SEARCH_CONTACTS')
          : i18n.t('FORWARD.ALL_CONTACTS')}
      </Text>

      {/* Loading state */}
      {isLoading && filteredContacts.length === 0 && (
        <View style={tailwind.style('py-8 items-center')}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#3B82F6'} />
          <Text
            style={tailwind.style(
              'text-sm font-inter-normal-20 mt-2',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}>
            Carregando contatos...
          </Text>
        </View>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <View style={tailwind.style('py-8 items-center px-4')}>
          <Text
            style={tailwind.style(
              'text-base font-inter-normal-20 text-red-500 text-center',
            )}>
            Erro ao carregar contatos: {error}
          </Text>
          <Pressable
            onPress={() => dispatch(contactActions.searchContacts({ page: 1, sort: 'name' }))}
            style={tailwind.style('mt-4 px-4 py-2 bg-blue-500 rounded-lg')}>
            <Text style={tailwind.style('text-white font-inter-medium-24')}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredContacts.length === 0 && !showRecentSection && (
        <View style={tailwind.style('py-8 items-center')}>
          <Text
            style={tailwind.style(
              'text-base font-inter-normal-20',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}>
            {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
          </Text>
        </View>
      )}
    </>
  ), [showRecentSection, isDark, recentContacts, searchQuery, isLoading, filteredContacts.length, error, dispatch]);

  return (
    <KeyboardAvoidingView 
      style={tailwind.style('flex-1', isDark ? 'bg-gray-950' : 'bg-white')}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[tailwind.style('flex-1'), { paddingTop: top }]}>
        {/* Header */}
        <View
          style={tailwind.style(
            'flex-row items-center justify-between px-4 py-3 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200',
          )}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text
              style={tailwind.style(
                'text-base font-inter-medium-24',
                isDark ? 'text-blue-400' : 'text-blue-600',
              )}>
              {i18n.t('FORWARD.CANCEL')}
            </Text>
          </Pressable>
          <Text
            style={tailwind.style(
              'text-base font-inter-semibold-20',
              isDark ? 'text-white' : 'text-gray-900',
            )}>
            {i18n.t('FORWARD.SEND_TO')}
          </Text>
          <View style={tailwind.style('w-16')} />
        </View>

        {/* Search Bar */}
        <View
          style={tailwind.style(
            'flex-row items-center mx-4 my-3 px-3 py-2 rounded-xl',
            isDark ? 'bg-gray-800' : 'bg-gray-100',
          )}>
          <View style={tailwind.style('w-5 h-5')}>
            <SearchIcon stroke={isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
          <TextInput
            style={tailwind.style(
              'flex-1 ml-2 text-base font-inter-normal-20 py-1',
              isDark ? 'text-white' : 'text-gray-900',
            )}
            placeholder={i18n.t('FORWARD.SEARCH_CONTACTS')}
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#3B82F6'} />
          )}
        </View>

        {/* Contact List */}
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={tailwind.style('flex-1')}
        />

        {/* Bottom Section - Message Input & Forward Button */}
        {selectedCount > 0 && (
          <View
            style={[
              tailwind.style(
                'border-t px-4 pt-3',
                isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200',
              ),
              { paddingBottom: Math.max(bottom, 16) },
            ]}>
            {/* Message Input */}
            <View
              style={tailwind.style(
                'flex-row items-center px-3 py-2 rounded-xl mb-3',
                isDark ? 'bg-gray-800' : 'bg-gray-100',
              )}>
              <TextInput
                style={tailwind.style(
                  'flex-1 text-base font-inter-normal-20 py-1',
                  isDark ? 'text-white' : 'text-gray-900',
                )}
                placeholder={i18n.t('FORWARD.ADD_MESSAGE')}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={localMessage}
                onChangeText={setLocalMessage}
                multiline
                maxLength={500}
              />
            </View>

            {/* Selected Contacts & Forward Button */}
            <View style={tailwind.style('flex-row items-center justify-between')}>
              <View style={tailwind.style('flex-1 mr-3')}>
                <Text
                  style={tailwind.style(
                    'text-sm font-inter-normal-20',
                    isDark ? 'text-gray-400' : 'text-gray-500',
                  )}
                  numberOfLines={1}>
                  {selectedContactsText}
                </Text>
              </View>
              <Pressable
                onPress={handleForward}
                style={({ pressed }) =>
                  tailwind.style(
                    'px-4 py-2',
                    pressed ? 'opacity-70' : '',
                  )
                }>
                <Text
                  style={tailwind.style(
                    'text-base font-inter-semibold-20',
                    isDark ? 'text-blue-400' : 'text-blue-600',
                  )}>
                  {i18n.t('FORWARD.FORWARD_BUTTON')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForwardContactsScreen;
