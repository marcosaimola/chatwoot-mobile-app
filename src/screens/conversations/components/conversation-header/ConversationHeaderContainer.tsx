import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { useConversationListStateContext, useThemeContext } from '@/context';
import { tailwind } from '@/theme';
import { useHaptic } from '@/utils';
import { getSearchFilteredConversations } from '@/store/conversation/conversationSelectors';
import { selectUserId } from '@/store/auth/authSelectors';
import {
  resetFilters,
  selectFilters,
  defaultFilterState,
  FilterState,
} from '@/store/conversation/conversationFilterSlice';
import {
  clearSelection,
  selectAll,
  selectSelectedConversations,
} from '@/store/conversation/conversationSelectedSlice';
import {
  selectCurrentState,
  selectSearchTerm,
  selectApiSearchConversationIds,
  selectIsSearchingAPI,
  setCurrentState,
  setSearchTerm,
  clearApiSearchResults,
} from '@/store/conversation/conversationHeaderSlice';
import { conversationActions } from '@/store/conversation/conversationActions';
import { ConversationFilterBar } from '../conversation-filters';
import { ConversationHeaderPresenter } from './ConversationHeaderPresenter';
import { SearchBar } from '@/components-next';

import { useAppDispatch, useAppSelector } from '@/hooks';
import i18n from '@/i18n';

const MIN_SEARCH_LENGTH_FOR_API = 4;
const SEARCH_DEBOUNCE_MS = 500;

const getFiltersAppliedCount = (defaultState: FilterState, updatedState: FilterState): number => {
  let count = 0;
  for (const objKey in defaultState) {
    const key = objKey as keyof FilterState;
    if (defaultState[key] !== updatedState[key]) {
      count++;
    }
  }
  return count;
};

export const ConversationHeader = () => {
  const currentState = useAppSelector(selectCurrentState);
  const searchTerm = useAppSelector(selectSearchTerm) || '';
  const apiSearchConversationIds = useAppSelector(selectApiSearchConversationIds) || [];
  const isSearchingAPI = useAppSelector(selectIsSearchingAPI) || false;
  const { isDark } = useThemeContext();

  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { openedRowIndex } = useConversationListStateContext();

  const allConversations = useAppSelector(state =>
    getSearchFilteredConversations(state, filters, userId, searchTerm, apiSearchConversationIds),
  );

  // Trigger API search when search term >= 4 characters
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const trimmedSearchTerm = searchTerm.trim();

    // Clear results and return if term is too short
    if (trimmedSearchTerm.length < MIN_SEARCH_LENGTH_FOR_API) {
      dispatch(clearApiSearchResults());
      return;
    }

    // Debounce API search - search conversations only
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(conversationActions.searchConversations({ query: trimmedSearchTerm }));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const selectedConversations = useAppSelector(selectSelectedConversations);

  const isSelectedAll = useMemo(
    () => selectedConversations.length === allConversations.length,
    [selectedConversations, allConversations],
  );

  const hapticSuccess = useHaptic('success');

  const headerBorderColor = isDark
    ? (tailwind.color('text-whiteA-A3') as string)
    : (tailwind.color('text-blackA-A3') as string);

  const headerOpenState = useDerivedValue(() =>
    currentState !== 'none' && currentState !== 'Select' ? withSpring(1) : withSpring(0),
  );

  // This creates a subtle visual effect where the border fades away when the header is in an active state (Search/Filter) and reappears when returning to the default state.
  const headerBorderAnimation = useAnimatedStyle(() => {
    return {
      borderBottomColor: interpolateColor(
        headerOpenState.value,
        [0, 1],
        [headerBorderColor, 'transparent'],
      ),
    };
  }, []);

  useEffect(() => {
    if (currentState !== 'none') {
      openedRowIndex.value = -1;
    }
  }, [currentState, openedRowIndex]);

  const handleSearchChange = useCallback(
    (text: string) => {
      dispatch(setSearchTerm(text));
    },
    [dispatch],
  );

  const handleCloseSearch = useCallback(() => {
    dispatch(setSearchTerm(''));
    dispatch(clearApiSearchResults());
    dispatch(setCurrentState('none'));
  }, [dispatch]);

  const handleLeftIconPress = () => {
    if (currentState === 'Search') {
      handleCloseSearch();
    } else if (currentState === 'Select') {
      if (isSelectedAll) {
        dispatch(clearSelection());
      } else {
        dispatch(selectAll(allConversations));
      }
    } else {
      dispatch(setCurrentState('Search'));
    }
  };

  const handleRightIconPress = () => {
    if (currentState === 'Filter') {
      dispatch(setCurrentState('none'));
    } else if (currentState === 'Select') {
      dispatch(clearSelection());
      dispatch(setCurrentState('none'));
    } else {
      dispatch(setCurrentState('Filter'));
    }
  };

  const filtersAppliedCount = useMemo(
    () => getFiltersAppliedCount(defaultFilterState, filters),
    [filters],
  );

  const handleClearFilter = () => {
    hapticSuccess?.();
    dispatch(resetFilters());
  };

  return (
    <Animated.View style={[tailwind.style('border-b-[1px]'), headerBorderAnimation]}>
      {currentState === 'Search' ? (
        <Animated.View style={tailwind.style('flex-row items-center px-3 pb-3 pt-2')}>
          <Animated.View style={tailwind.style('flex-1')}>
            <SearchBar
              value={searchTerm}
              onChangeText={handleSearchChange}
              placeholder={i18n.t('CONVERSATION.SEARCH.PLACEHOLDER')}
              isLoading={isSearchingAPI}
              autoFocus
            />
          </Animated.View>
          <Pressable onPress={handleCloseSearch} hitSlop={8} style={tailwind.style('pl-3')}>
            <Text
              style={tailwind.style(
                `text-md font-inter-medium-24 leading-[17px] tracking-[0.24px] text-blue-800`,
              )}>
              {i18n.t('CONVERSATION.SEARCH.CANCEL')}
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <ConversationHeaderPresenter
          currentState={currentState}
          isSelectedAll={isSelectedAll}
          filtersAppliedCount={filtersAppliedCount}
          onLeftIconPress={handleLeftIconPress}
          onRightIconPress={handleRightIconPress}
          onClearFilter={handleClearFilter}
        />
      )}
      {currentState === 'Filter' ? <ConversationFilterBar /> : null}
    </Animated.View>
  );
};
