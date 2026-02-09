import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/constants';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { contactNotesActions } from '@/store/contact/contactNotesActions';
import {
  selectContactNotes,
  selectIsLoadingContactNotes,
} from '@/store/contact/contactNotesSelectors';
import { ContactNote } from '@/store/contact/contactTypes';
import { EmptyStateIcon, CloseIcon } from '@/svg-icons';
import { formatRelativeTime } from '@/utils/dateTimeUtils';
import { formatTimeToShortForm } from '@/utils/dateTimeUtils';
import { Avatar } from '@/components-next';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';

type ContactNotesTabProps = {
  contactId: number;
};

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<ContactNote>);

const NoteItem = ({ note }: { note: ContactNote }) => {
  const { colors } = useThemeContext();

  const formattedTime = () => {
    const time = formatRelativeTime(note.created_at);
    return formatTimeToShortForm(time, true);
  };

  return (
    <Animated.View style={tailwind.style(`ml-3 py-3 pr-4 border-b-[1px] ${colors.borderPrimary}`)}>
      <Animated.View style={tailwind.style('flex flex-row gap-3')}>
        <Avatar
          src={note.user.thumbnail ? { uri: note.user.thumbnail } : undefined}
          size="sm"
          name={note.user.name || note.user.available_name}
        />
        <Animated.View style={tailwind.style('flex-1')}>
          <Animated.View style={tailwind.style('flex-row items-center gap-2 mb-1')}>
            <Animated.Text style={tailwind.style(`text-sm font-inter-medium-24 ${colors.textPrimary}`)}>
              {note.user.name || note.user.available_name}
            </Animated.Text>
            <Animated.Text style={tailwind.style(`text-xs font-inter-420-20 ${colors.textSecondary}`)}>
              {formattedTime()}
            </Animated.Text>
          </Animated.View>
          <Animated.Text style={tailwind.style(`text-md font-inter-normal-20 ${colors.textPrimary}`)}>
            {note.content}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export const ContactNotesTab = (props: ContactNotesTabProps) => {
  const { contactId } = props;
  const { colors, isDark } = useThemeContext();
  const { bottom, top } = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const notes = useAppSelector(state => selectContactNotes(state, contactId));
  const isLoading = useAppSelector(state => selectIsLoadingContactNotes(state, contactId));

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const fetchNotes = useCallback(async () => {
    await dispatch(contactNotesActions.getContactNotes({ contactId }));
  }, [dispatch, contactId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotes();
    setIsRefreshing(false);
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async () => {
    if (!newNote.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await dispatch(
        contactNotesActions.createContactNote({
          contactId,
          content: newNote.trim(),
        }),
      );
      setNewNote('');
      setIsInputFocused(false);
      Keyboard.dismiss();
      showToast({ message: i18n.t('CONTACT_DETAILS.NOTE_CREATED') });
    } catch {
      showToast({ message: i18n.t('CONTACT_DETAILS.NOTE_ERROR') });
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, contactId, newNote, isCreating]);

  const handleCancel = useCallback(() => {
    setNewNote('');
    setIsInputFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleRender: ListRenderItem<ContactNote> = ({ item }) => {
    return <NoteItem note={item} />;
  };

  return (
    <KeyboardAvoidingView
      style={tailwind.style('flex-1')}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + top + 80 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={tailwind.style('flex-1')}>
          {/* LISTA / EMPTY STATES */}
          {isLoading && notes.length === 0 ? (
            <Animated.View
              style={tailwind.style(
                'flex-1 items-center justify-center',
                `pb-[${TAB_BAR_HEIGHT + 100}px]`,
              )}>
              <ActivityIndicator color={isDark ? '#FFFFFF' : undefined} />
            </Animated.View>
          ) : notes.length === 0 ? (
            <Animated.ScrollView
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
              contentContainerStyle={tailwind.style(
                'flex-1 items-center justify-center',
                `pb-[${TAB_BAR_HEIGHT + 100}px]`,
              )}
              keyboardShouldPersistTaps="handled">
              <EmptyStateIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />
              <Animated.Text style={tailwind.style(`pt-6 text-md tracking-[0.32px] ${colors.textSecondary}`)}>
                {i18n.t('CONTACT_DETAILS.NO_NOTES')}
              </Animated.Text>
            </Animated.ScrollView>
          ) : (
            <AnimatedFlashlist
              style={tailwind.style('flex-1')}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
              data={notes}
              estimatedItemSize={80}
              renderItem={handleRender}
              contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT + 100}px]`)}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* INPUT FIXADO EMBAIXO */}
          <Animated.View
            style={tailwind.style(
              `px-4 py-3 border-t-[1px] ${colors.borderPrimary}`,
              isDark ? 'bg-gray-950' : 'bg-white',
              `pb-[${bottom + 12}px]`,
            )}>
            <Animated.View
              style={tailwind.style(
                'flex-row gap-2 items-end',
                isDark ? `${colors.bgSecondary} border ${colors.borderPrimary}` : 'bg-gray-100',
                'rounded-xl px-3 py-2',
              )}>
              <TextInput
                ref={textInputRef}
                style={tailwind.style(
                  `flex-1 text-md font-inter-normal-20 min-h-[40px] max-h-[100px] ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`,
                )}
                placeholder={i18n.t('CONTACT_DETAILS.ADD_NOTE_PLACEHOLDER')}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={newNote}
                onChangeText={setNewNote}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isCreating) {
                      setIsInputFocused(false);
                    }
                  }, 100);
                }}
                multiline
                editable={!isCreating}
              />
              {isInputFocused && (
                <Pressable onPress={handleCancel} hitSlop={8} style={tailwind.style('p-1')}>
                  <CloseIcon stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                </Pressable>
              )}
              <Pressable
                onPress={handleCreateNote}
                disabled={!newNote.trim() || isCreating}
                style={({ pressed }) => [
                  tailwind.style(
                    'px-4 py-2 rounded-lg',
                    newNote.trim() ? 'bg-blue-600' : 'bg-gray-400',
                    pressed && newNote.trim() && 'bg-blue-700',
                    (isCreating || !newNote.trim()) && 'opacity-50',
                  ),
                ]}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Animated.Text style={tailwind.style('text-sm font-inter-medium-24 text-white')}>
                    {i18n.t('CONTACT_DETAILS.ADD_NOTE')}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
