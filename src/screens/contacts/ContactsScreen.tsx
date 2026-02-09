import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, StatusBar, TextInput, Pressable } from 'react-native';
import Animated, {
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetModal, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';

import { TAB_BAR_HEIGHT } from '@/constants';
import { useThemeContext } from '@/context';
import { Contact } from '@/types/Contact';
import { tailwind } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { contactActions } from '@/store/contact/contactActions';
import {
  selectIsAllContactsFetched,
  selectIsLoadingContacts,
  selectContactList,
  selectSearchQuery,
} from '@/store/contact/contactListSelectors';
import { ContactsHeader, ContactItem, ContactImportSheet, ContactImportProgress, ContactSortSheet } from './components';
import { resetContacts, setSearchQuery } from '@/store/contact/contactListSlice';
import { EmptyStateIcon } from '@/svg-icons';
import { ContactsStackParamList } from '@/navigation/stack/ContactsStack';
import { contactImportActions } from '@/store/contact/contactImportActions';
import { BottomSheetHeader, BottomSheetWrapper } from '@/components-next/common/bottomsheet';
import { BottomSheetBackdrop } from '@/components-next/common/bottomsheet/BottomSheetBackdrop';
import { showToast } from '@/utils/toastUtils';
import { useHaptic } from '@/utils';
import { resetImport } from '@/store/contact/contactImportSlice';
import i18n from '@/i18n';
import { normalizeToE164 } from '@/utils/phoneUtils';
import { CreateConversationSheet, CreateConversationSheetHandle } from '@/screens/conversations/components';

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Contact>);

const ContactsList = () => {
  const { colors, isDark } = useThemeContext();
  const [pageNumber, setPageNumber] = useState(1);
  const [isFlashListReady, setFlashListReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const createConversationSheetRef = useRef<CreateConversationSheetHandle>(null);
  const hapticSelection = useHaptic();

  const isContactsLoading = useAppSelector(selectIsLoadingContacts);
  const isAllContactsFetched = useAppSelector(selectIsAllContactsFetched);
  const contacts = useAppSelector(selectContactList);
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(state => state.contactList.sortBy);
  const sortOrder = useAppSelector(state => state.contactList.sortOrder);

  const dispatch = useAppDispatch();

  const normalizedSearchPhone = useMemo(() => normalizeToE164(searchQuery), [searchQuery]);
  const isPhoneNumberSearch = Boolean(normalizedSearchPhone);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchContacts = useCallback(
    async (page: number = 1) => {
      // Build sort parameter: if desc, add minus prefix
      const sortParam = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
      
      dispatch(
        contactActions.searchContacts({
          page,
          q: debouncedSearchQuery || undefined,
          sort: sortParam,
          include_contact_inboxes: false,
        }),
      );
    },
    [dispatch, debouncedSearchQuery, sortBy, sortOrder],
  );

  const clearAndFetchContacts = useCallback(async () => {
    setPageNumber(1);
    await dispatch(resetContacts());
    fetchContacts(1);
  }, [dispatch, fetchContacts]);

  // Load contacts on mount (initial load)
  useEffect(() => {
    // Initial load with sort=name (no search query)
    setPageNumber(1);
    dispatch(resetContacts());
    const sortParam = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
    dispatch(
      contactActions.searchContacts({
        page: 1,
        sort: sortParam,
        include_contact_inboxes: false,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Reload when search query, sort, or order changes
  useEffect(() => {
    clearAndFetchContacts();
  }, [clearAndFetchContacts]);

  // eslint-disable-next-line react/display-name
  const ListFooterComponent = React.memo(() => {
    if (isAllContactsFetched) return null;
    return (
      <Animated.View
        style={tailwind.style(
          'flex-1 items-center justify-center pt-8',
          `pb-[${TAB_BAR_HEIGHT}px]`,
        )}>
        {isAllContactsFetched ? null : <ActivityIndicator size="small" />}
      </Animated.View>
    );
  });

  const onChangePageNumber = () => {
    const nextPageNumber = pageNumber + 1;
    setPageNumber(nextPageNumber);
    fetchContacts(nextPageNumber);
  };

  const handleOnEndReached = () => {
    const shouldLoadMoreContacts =
      isFlashListReady && !isAllContactsFetched && !isContactsLoading;
    if (shouldLoadMoreContacts) {
      onChangePageNumber();
    }
  };

  const handleRefresh = useCallback(() => {
    setFlashListReady(false);
    setIsRefreshing(true);
    clearAndFetchContacts().finally(() => {
      setIsRefreshing(false);
    });
  }, [clearAndFetchContacts]);

  const handleRender: ListRenderItem<Contact> = ({ item }) => {
    return <ContactItem contact={item} />;
  };

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      if (!isFlashListReady) {
        runOnJS(setFlashListReady)(true);
      }
    },
  });

  const handleSearch = useCallback(
    (query: string) => {
      // Search is handled by the debounced effect
    },
    [],
  );

  const handleCreateConversation = useCallback(() => {
    if (!normalizedSearchPhone) {
      return;
    }
    hapticSelection?.();
    createConversationSheetRef.current?.present(normalizedSearchPhone);
  }, [hapticSelection, normalizedSearchPhone]);

  const shouldShowEmptyLoader = isContactsLoading && contacts.length === 0;

  return shouldShowEmptyLoader ? (
    <Animated.View
      style={tailwind.style('flex-1 items-center justify-center', `pb-[${TAB_BAR_HEIGHT}px]`)}>
      <ActivityIndicator color={isDark ? '#FFFFFF' : undefined} />
    </Animated.View>
  ) : contacts.length === 0 ? (
    <>
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={tailwind.style(
          'flex-1 items-center justify-center',
          `pb-[${TAB_BAR_HEIGHT}px]`,
        )}>
        <EmptyStateIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />
        <Animated.Text style={tailwind.style(`pt-6 text-md tracking-[0.32px] ${colors.textSecondary}`)}>
          {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato'}
        </Animated.Text>
        {isPhoneNumberSearch && (
          <Pressable
            onPress={handleCreateConversation}
            style={({ pressed }) => [
              tailwind.style(
                'mt-6 py-3 px-6 rounded-xl',
                isDark ? 'bg-blue-600' : 'bg-blue-600',
                pressed && (isDark ? 'bg-blue-700' : 'bg-blue-700'),
              ),
            ]}>
            <Animated.Text style={tailwind.style('text-md font-inter-medium-24 text-white')}>
              {i18n.t('CREATE_CONVERSATION.BUTTON')}
            </Animated.Text>
          </Pressable>
        )}
      </Animated.ScrollView>
      <CreateConversationSheet ref={createConversationSheetRef} />
    </>
  ) : (
    <AnimatedFlashlist
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      layout={LinearTransition.springify().damping(18).stiffness(120)}
      showsVerticalScrollIndicator={false}
      data={contacts}
      estimatedItemSize={71}
      onScroll={scrollHandler}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
      renderItem={handleRender}
      contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
    />
  );
};

type ContactsScreenNavigationProp = NativeStackNavigationProp<
  ContactsStackParamList,
  'ContactsScreen'
>;

const ContactsScreen = () => {
  const { colors, isDark } = useThemeContext();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(state => state.contactList.sortBy);
  const sortOrder = useAppSelector(state => state.contactList.sortOrder);
  const isImporting = useAppSelector(state => state.contactImport.isImporting);
  
  const importSheetRef = useRef<BottomSheetModal>(null);
  const progressSheetRef = useRef<BottomSheetModal>(null);
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const autoDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch],
  );

  const handleAddPress = useCallback(() => {
    importSheetRef.current?.present();
  }, []);

  useEffect(() => {
    return () => {
      if (autoDismissTimeoutRef.current) {
        clearTimeout(autoDismissTimeoutRef.current);
        autoDismissTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSortPress = useCallback(() => {
    sortSheetRef.current?.present();
  }, []);

  const handleCreateNew = useCallback(() => {
    importSheetRef.current?.dismiss();
    navigation.navigate('CreateContactScreen');
  }, [navigation]);

  const runImport = useCallback(
    async (shouldPresentProgressSheet: boolean, shouldAutoDismiss: boolean) => {
      if (autoDismissTimeoutRef.current) {
        clearTimeout(autoDismissTimeoutRef.current);
        autoDismissTimeoutRef.current = null;
      }

      // Reset import state before showing progress sheet
      dispatch(resetImport());

      try {
        if (shouldPresentProgressSheet) {
          console.log('[ContactsScreen] Presenting progress sheet...');
          try {
            progressSheetRef.current?.present();
          } catch (e) {
            console.error('[ContactsScreen] Error presenting progress sheet:', e);
          }
        }

        console.log('[ContactsScreen] Dispatching importContactsFromDevice...');
        // Start import
        const result = await dispatch(contactImportActions.importContactsFromDevice()).unwrap();
        console.log('[ContactsScreen] Import result:', result);

        showToast({
          message: `${result.imported} contatos importados com sucesso${result.failed > 0 ? `, ${result.failed} falharam` : ''}`,
        });

        if (shouldAutoDismiss) {
          // Refresh contacts list after sheet is dismissed
          autoDismissTimeoutRef.current = setTimeout(() => {
            progressSheetRef.current?.dismiss();
            dispatch(resetImport());

            // Refresh contacts list with current sort
            const sortParam = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
            dispatch(resetContacts());
            dispatch(
              contactActions.searchContacts({
                page: 1,
                q: searchQuery || undefined,
                sort: sortParam,
                include_contact_inboxes: false,
              }),
            );
          }, 5000); // Wait 5 seconds to show results before dismissing
        }
      } catch (error) {
        console.error('[ContactsScreen] Import error:', error);
        // Handle both Error objects and string errors from rejectWithValue
        let errorMessage = 'Erro ao importar contatos';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object') {
          // Try to extract message from object
          const errObj = error as any;
          errorMessage = errObj.message || errObj.error || JSON.stringify(error);
        }
        console.log('[ContactsScreen] Showing toast with message:', errorMessage);
        showToast({ message: errorMessage });

        if (shouldAutoDismiss) {
          // Dismiss after error too
          autoDismissTimeoutRef.current = setTimeout(() => {
            progressSheetRef.current?.dismiss();
            dispatch(resetImport());
          }, 3000);
        }
      }
    },
    [dispatch, searchQuery, sortBy, sortOrder],
  );

  const handleImportContacts = useCallback(async () => {
    console.log('[ContactsScreen] handleImportContacts called');

    try {
      importSheetRef.current?.dismiss();
    } catch (e) {
      console.error('[ContactsScreen] Error dismissing import sheet:', e);
    }

    await runImport(true, true);
  }, [runImport]);

  const handleReprocessImport = useCallback(async () => {
    console.log('[ContactsScreen] handleReprocessImport called');
    await runImport(false, false);
  }, [runImport]);

  return (
    <SafeAreaView edges={['top']} style={tailwind.style(`flex-1 ${colors.bgPrimary}`)}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color(colors.statusBarBg)}
        barStyle={colors.statusBarStyle}
      />
      <ContactsHeader onSearch={handleSearch} onAddPress={handleAddPress} onSortPress={handleSortPress} />
      <ContactsList />
      
      {/* Import Options Sheet */}
      <BottomSheetModal
        ref={importSheetRef}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={tailwind.style(colors.bgPrimary)}
        handleIndicatorStyle={tailwind.style(`overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-grayDark-600' : 'bg-blackA-A6'}`)}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        snapPoints={['25%']}>
        <BottomSheetWrapper>
          <BottomSheetHeader headerText="Adicionar Contato" />
          <ContactImportSheet
            onCreateNew={handleCreateNew}
            onImportContacts={handleImportContacts}
          />
        </BottomSheetWrapper>
      </BottomSheetModal>

      {/* Import Progress Sheet */}
      <BottomSheetModal
        ref={progressSheetRef}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={tailwind.style(colors.bgPrimary)}
        handleIndicatorStyle={tailwind.style(`overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-grayDark-600' : 'bg-blackA-A6'}`)}
        enablePanDownToClose={false}
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        snapPoints={['70%']}
        enableDynamicSizing={false}>
        <BottomSheetWrapper fillHeight>
          <BottomSheetHeader headerText={isImporting ? "Importando Contatos" : "Resultado da Importação"} />
          <ContactImportProgress onReprocess={handleReprocessImport} />
        </BottomSheetWrapper>
      </BottomSheetModal>

      {/* Sort Sheet */}
      <BottomSheetModal
        ref={sortSheetRef}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={tailwind.style(colors.bgPrimary)}
        handleIndicatorStyle={tailwind.style(`overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-grayDark-600' : 'bg-blackA-A6'}`)}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        snapPoints={['50%']}>
        <BottomSheetWrapper>
          <BottomSheetHeader headerText={i18n.t('CONTACTS.SORT.SORT_BY')} />
          <ContactSortSheet onDismiss={() => sortSheetRef.current?.dismiss()} />
        </BottomSheetWrapper>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default ContactsScreen;
