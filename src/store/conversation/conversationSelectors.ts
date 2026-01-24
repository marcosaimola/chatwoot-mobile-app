import { createDraftSafeSelector, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { conversationAdapter } from './conversationSlice';
import { FilterState } from '@/store/conversation/conversationFilterSlice';
import { CONVERSATION_PRIORITY_ORDER } from '@/constants';
import { shouldApplyFilters } from '@/utils/conversationUtils';
import type { Conversation } from '@/types';
import { MESSAGE_TYPES } from '@/constants';

/**
 * Check if a conversation matches the search term
 * Searches in: contact name, email, phone number, and last message content
 */
export const matchesSearchTerm = (conversation: Conversation, searchTerm: string): boolean => {
  if (!searchTerm || searchTerm.trim() === '') {
    return true;
  }

  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  const { sender } = conversation.meta;

  // Search in contact name
  if (sender?.name?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }

  // Search in contact email
  if (sender?.email?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }

  // Search in contact phone number
  if (sender?.phoneNumber?.includes(searchTerm.trim())) {
    return true;
  }

  // Search in last non-activity message content
  if (conversation.lastNonActivityMessage?.content?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }

  return false;
};

export const selectConversationsState = (state: RootState) => state.conversations;

export const {
  selectAll: selectAllConversations,
  selectById: selectConversationById,
  selectIds: selectConversationIds,
} = conversationAdapter.getSelectors<RootState>(selectConversationsState);

export const selectConversationsLoading = createSelector(
  selectConversationsState,
  state => state.isLoadingConversations,
);

export const selectConversationError = createSelector(
  selectConversationsState,
  state => state.error,
);

export const selectConversationFetching = createSelector(
  selectConversationsState,
  state => state.isConversationFetching,
);

export const selectIsAllConversationsFetched = createSelector(
  selectConversationsState,
  state => state.isAllConversationsFetched,
);

export const selectIsAllMessagesFetched = createSelector(
  selectConversationsState,
  state => state.isAllMessagesFetched,
);

export const selectIsLoadingMessages = createSelector(
  selectConversationsState,
  state => state.isLoadingMessages,
);

export const getFilteredConversations = createDraftSafeSelector(
  [
    selectAllConversations,
    (_, filters: FilterState) => filters,
    (_, __, userId: number | undefined) => userId,
  ],
  (conversations, filters, userId) => {
    const { assignee_type: assigneeType, sort_by: sortBy } = filters;
    let sortType = filters.sort_by; // Create mutable variable

    type SortComparator = {
      latest: (a: Conversation, b: Conversation) => number;
      sort_on_created_at: (a: Conversation, b: Conversation) => number;
      sort_on_priority: (a: Conversation, b: Conversation) => number;
    };

    const comparator: SortComparator = {
      latest: (a, b) => b.lastActivityAt - a.lastActivityAt,
      sort_on_created_at: (a, b) => a.createdAt - b.createdAt,
      sort_on_priority: (a, b) => {
        const priorityA = a.priority || 'low';
        const priorityB = b.priority || 'low';
        return CONVERSATION_PRIORITY_ORDER[priorityA] - CONVERSATION_PRIORITY_ORDER[priorityB];
      },
    };

    // Type guard to ensure sortBy is a valid key of comparator
    const isValidSortBy = (sort: string): sort is keyof SortComparator => {
      return sort in comparator;
    };

    if (!isValidSortBy(sortBy)) {
      // Default to 'latest' if invalid sortBy
      sortType = 'latest';
    }

    const sortedConversations = conversations.sort(comparator[sortType as keyof SortComparator]);

    if (assigneeType === 'me') {
      return sortedConversations.filter(conversation => {
        const { assignee } = conversation.meta;

        const shouldFilter = shouldApplyFilters(conversation, filters);
        const isAssignedToMe = assignee && assignee.id === userId;
        const isChatMine = isAssignedToMe && shouldFilter;
        return isChatMine;
      });
    }
    if (assigneeType === 'unassigned') {
      return sortedConversations.filter(conversation => {
        const isUnAssigned = !conversation.meta.assignee;
        const shouldFilter = shouldApplyFilters(conversation, filters);
        return isUnAssigned && shouldFilter;
      });
    }

    return sortedConversations.filter(conversation => {
      const shouldFilter = shouldApplyFilters(conversation, filters);
      return shouldFilter;
    });
  },
);

export const getMessagesByConversationId = createDraftSafeSelector(
  [
    (state: RootState, params: { conversationId: number }) =>
      selectConversationById(state, params.conversationId),
  ],
  conversation => {
    if (!conversation) {
      return [];
    }
    // Memoize the sorted and filtered messages using createSelector
    return conversation.messages
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .reverse()
      .filter((message, index, self) => index === self.findIndex(m => m.id === message.id));
  },
);

export const getLastEmailInSelectedChat = createDraftSafeSelector(
  [
    (state: RootState, params: { conversationId: number }) =>
      selectConversationById(state, params.conversationId),
  ],
  conversation => {
    if (!conversation) {
      return [];
    }
    const lastEmail = [...conversation.messages].reverse().find(message => {
      const { contentAttributes = {}, messageType } = message;
      const { email = {} } = contentAttributes || {};
      const isIncomingOrOutgoing =
        messageType === MESSAGE_TYPES.OUTGOING || messageType === MESSAGE_TYPES.INCOMING;
      if (email.from && isIncomingOrOutgoing) {
        return true;
      }
      return false;
    });
    return lastEmail;
  },
);

/**
 * Get filtered conversations with search term applied
 * When searching, ignores status/assignee filters to show all matching conversations
 * Also considers API search results (conversation IDs) when available
 */
export const getSearchFilteredConversations = createDraftSafeSelector(
  [
    selectAllConversations,
    (_, filters: FilterState) => filters,
    (_, __, userId: number | undefined) => userId,
    (_, __, ___, searchTerm: string) => searchTerm,
    (_, __, ___, ____, apiSearchConversationIds: number[] = []) => apiSearchConversationIds,
  ],
  (conversations, filters, userId, searchTerm, apiSearchConversationIds) => {
    const { assignee_type: assigneeType, sort_by: sortBy } = filters;
    let sortType = filters.sort_by;

    type SortComparator = {
      latest: (a: Conversation, b: Conversation) => number;
      sort_on_created_at: (a: Conversation, b: Conversation) => number;
      sort_on_priority: (a: Conversation, b: Conversation) => number;
    };

    const comparator: SortComparator = {
      latest: (a, b) => b.lastActivityAt - a.lastActivityAt,
      sort_on_created_at: (a, b) => a.createdAt - b.createdAt,
      sort_on_priority: (a, b) => {
        const priorityA = a.priority || 'low';
        const priorityB = b.priority || 'low';
        return CONVERSATION_PRIORITY_ORDER[priorityA] - CONVERSATION_PRIORITY_ORDER[priorityB];
      },
    };

    const isValidSortBy = (sort: string): sort is keyof SortComparator => {
      return sort in comparator;
    };

    if (!isValidSortBy(sortBy)) {
      sortType = 'latest';
    }

    const sortedConversations = conversations.sort(comparator[sortType as keyof SortComparator]);

    // If there's an active search, ignore status/assignee filters and search all conversations
    const isSearchActive = searchTerm && searchTerm.trim() !== '';

    if (isSearchActive) {
      // When searching, filter ALL conversations by search criteria (ignore other filters)
      return sortedConversations.filter(conversation => {
        // Check local search match
        if (matchesSearchTerm(conversation, searchTerm)) {
          return true;
        }
        // Check if conversation ID matches API search results
        if (apiSearchConversationIds.length > 0 && apiSearchConversationIds.includes(conversation.id)) {
          return true;
        }
        return false;
      });
    }

    // No search active - apply normal filters
    let filteredByAssignee: Conversation[];
    if (assigneeType === 'me') {
      filteredByAssignee = sortedConversations.filter(conversation => {
        const { assignee } = conversation.meta;
        const shouldFilter = shouldApplyFilters(conversation, filters);
        const isAssignedToMe = assignee && assignee.id === userId;
        return isAssignedToMe && shouldFilter;
      });
    } else if (assigneeType === 'unassigned') {
      filteredByAssignee = sortedConversations.filter(conversation => {
        const isUnAssigned = !conversation.meta.assignee;
        const shouldFilter = shouldApplyFilters(conversation, filters);
        return isUnAssigned && shouldFilter;
      });
    } else {
      filteredByAssignee = sortedConversations.filter(conversation => {
        return shouldApplyFilters(conversation, filters);
      });
    }

    return filteredByAssignee;
  },
);
