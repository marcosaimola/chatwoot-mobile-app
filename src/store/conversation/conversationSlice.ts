import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { Conversation } from '@/types/Conversation';
import { conversationActions } from './conversationActions';
import { findPendingMessageIndex } from '@/utils/conversationUtils';

import { MESSAGE_TYPES } from '@/constants';
import { Message } from '@/types/Message';
import { PendingMessage, SearchConversationsAPIResponse } from './conversationTypes';
import { Contact } from '@/types/Contact';
import { Agent } from '@/types/Agent';

/**
 * Transform a search result conversation from the API into a full Conversation object
 * for the store. Only adds to store if conversation doesn't already exist.
 */
function transformSearchResultToConversation(
  searchResult: SearchConversationsAPIResponse['payload']['conversations'][0],
): Conversation {
  const { id, account_id, created_at, message, contact, inbox, agent } = searchResult;

  // Transform contact to sender (Contact type)
  const sender: Contact = {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phoneNumber: contact.phone_number,
    identifier: contact.identifier,
    thumbnail: null,
    type: 'contact',
    createdAt: created_at,
    lastActivityAt: created_at,
    additionalAttributes: {},
    customAttributes: {},
  };

  // Transform agent to assignee (Agent type)
  const assignee: Agent | null = agent
    ? {
        id: agent.id,
        name: agent.name,
        availableName: agent.available_name,
        email: agent.email,
        thumbnail: null,
      }
    : null;

  // Transform message to Message type
  const transformedMessage: Message = {
    id: message.id,
    content: message.content,
    inboxId: message.inbox_id,
    conversationId: message.conversation_id,
    messageType: message.message_type,
    contentType: message.content_type as Message['contentType'],
    status: message.status as Message['status'],
    createdAt: message.created_at,
    private: message.private,
    sourceId: null,
    attachments: [],
    echoId: null,
    lastNonActivityMessage: null,
    senderId: 0,
  };

  // Build the full Conversation object
  const conversation: Conversation = {
    id,
    accountId: account_id,
    createdAt: created_at,
    lastActivityAt: created_at,
    timestamp: created_at,
    inboxId: inbox.id,
    status: 'open',
    priority: null,
    labels: [],
    unreadCount: 0,
    muted: false,
    canReply: true,
    snoozedUntil: null,
    uuid: '',
    waitingSince: 0,
    firstReplyCreatedAt: 0,
    agentLastSeenAt: 0,
    assigneeLastSeenAt: 0,
    contactLastSeenAt: 0,
    customAttributes: {},
    additionalAttributes: {},
    slaPolicyId: null,
    appliedSla: null,
    slaEvents: [],
    messages: [transformedMessage],
    lastNonActivityMessage: transformedMessage,
    meta: {
      sender,
      assignee: assignee as Agent,
      team: null,
      hmacVerified: null,
      channel: inbox.channel_type,
    },
  };

  return conversation;
}

export interface ConversationState {
  meta: {
    mineCount: number;
    unassignedCount: number;
    allCount: number;
  };
  error: string | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isAllConversationsFetched: boolean;
  isAllMessagesFetched: boolean;
  isConversationFetching: boolean;
  isChangingConversationStatus: boolean;
}

export const conversationAdapter = createEntityAdapter<Conversation>();

const initialState = conversationAdapter.getInitialState<ConversationState>({
  meta: {
    mineCount: 0,
    unassignedCount: 0,
    allCount: 0,
  },
  error: null,
  isLoadingConversations: false,
  isAllConversationsFetched: false,
  isLoadingMessages: false,
  isAllMessagesFetched: false,
  isConversationFetching: false,
  isChangingConversationStatus: false,
});

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    clearAllConversations: conversationAdapter.removeAll,
    addConversation: (state, action) => {
      const conversation = action.payload;
      conversationAdapter.addOne(state, conversation);
    },
    updateConversation: (state, action) => {
      const conversation = action.payload as Conversation;
      const conversationIds = conversationAdapter.getSelectors().selectIds(state);
      if (conversationIds.includes(conversation.id)) {
        const { messages, ...conversationAttributes } = conversation;
        conversationAdapter.updateOne(state, {
          id: conversation.id,
          changes: conversationAttributes,
        });
      } else {
        conversationAdapter.addOne(state, conversation);
      }
    },
    addOrUpdateMessage: (state, action) => {
      const message = action.payload as PendingMessage | Message;

      const { conversationId } = message;
      if (!conversationId) {
        return;
      }

      const conversation = state.entities[conversationId];

      // If the conversation is not present in the store, we don't need to add the message
      if (!conversation) {
        return;
      }
      // If the message type is incoming, set the can reply to true
      if (message.messageType === MESSAGE_TYPES.INCOMING) {
        conversation.canReply = true;
      }
      // Check message is already present in the conversation
      const pendingMessageIndex = findPendingMessageIndex(conversation, message);
      if (pendingMessageIndex !== -1) {
        conversation.messages[pendingMessageIndex] = message as Message;
      }
      // If the message is not present in the conversation, add it
      else {
        conversation.messages.push(message as Message);
      }
      conversation.timestamp = message.createdAt;
      conversation.unreadCount = (message as Message).conversation?.unreadCount || 0;
    },
    updateConversationLastActivity: (state, action) => {
      const { conversationId, lastActivityAt } = action.payload;
      const conversation = state.entities[conversationId];
      if (!conversation) {
        return;
      }
      conversation.lastActivityAt = lastActivityAt;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(conversationActions.fetchConversations.pending, state => {
        state.error = null;
        state.isLoadingConversations = true;
      })
      .addCase(conversationActions.fetchConversations.fulfilled, (state, { payload }) => {
        const { conversations, meta } = payload;
        conversationAdapter.upsertMany(state, conversations);
        state.isLoadingConversations = false;
        state.isAllConversationsFetched = conversations.length < 20 || false;
        state.meta = meta;
      })
      .addCase(conversationActions.fetchConversations.rejected, (state, { error }) => {
        state.isLoadingConversations = false;
      })
      .addCase(conversationActions.fetchConversation.pending, state => {
        state.error = null;
        state.isConversationFetching = true;
      })
      .addCase(conversationActions.fetchConversation.fulfilled, (state, { payload }) => {
        const { conversation } = payload;
        conversationAdapter.upsertOne(state, conversation);
        state.isConversationFetching = false;
        state.isAllMessagesFetched = false;
      })
      .addCase(conversationActions.fetchConversation.rejected, state => {
        state.isConversationFetching = false;
        state.error = state.error || 'Unable to load conversation';
      })
      .addCase(conversationActions.fetchPreviousMessages.pending, state => {
        state.isLoadingMessages = true;
      })
      .addCase(conversationActions.fetchPreviousMessages.fulfilled, (state, { payload }) => {
        const { messages, conversationId, meta } = payload;
        if (!state.entities[conversationId]) {
          return;
        }
        const conversation = state.entities[conversationId];
        conversation.messages.unshift(...messages);
        conversation.meta = {
          ...conversation.meta,
          ...meta,
        };
        state.isLoadingMessages = false;
        state.isAllMessagesFetched = messages.length < 20 || false;
      })
      .addCase(conversationActions.fetchPreviousMessages.rejected, state => {
        state.isLoadingMessages = false;
      })
      .addCase(conversationActions.toggleConversationStatus.pending, (state, action) => {
        state.isChangingConversationStatus = true;
      })
      .addCase(conversationActions.toggleConversationStatus.fulfilled, (state, { payload }) => {
        const { conversationId, currentStatus, snoozedUntil } = payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.status = currentStatus;
        conversation.snoozedUntil = snoozedUntil;
        state.isChangingConversationStatus = false;
      })
      .addCase(conversationActions.toggleConversationStatus.rejected, state => {
        state.isChangingConversationStatus = false;
      })
      .addCase(conversationActions.muteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.muted = true;
      })
      .addCase(conversationActions.unmuteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.muted = false;
      })
      .addCase(conversationActions.markMessagesUnread.fulfilled, (state, action) => {
        const { conversationId, unreadCount, agentLastSeenAt } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.unreadCount = unreadCount;
        conversation.agentLastSeenAt = agentLastSeenAt;
      })
      .addCase(conversationActions.markMessageRead.fulfilled, (state, action) => {
        const { conversationId, agentLastSeenAt, unreadCount } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.unreadCount = unreadCount;
        conversation.agentLastSeenAt = agentLastSeenAt;
      })
      .addCase(conversationActions.searchConversations.fulfilled, (state, { payload }) => {
        const searchResults = payload?.payload?.conversations;
        if (!searchResults || searchResults.length === 0) {
          return;
        }

        // Transform search results and add only new conversations to the store
        const conversationsToAdd: Conversation[] = [];
        const existingIds = conversationAdapter.getSelectors().selectIds(state);

        for (const searchResult of searchResults) {
          // Only add if conversation doesn't already exist in store
          if (!existingIds.includes(searchResult.id)) {
            const conversation = transformSearchResultToConversation(searchResult);
            conversationsToAdd.push(conversation);
          }
        }

        if (conversationsToAdd.length > 0) {
          conversationAdapter.upsertMany(state, conversationsToAdd);
        }
      });
  },
});

export const {
  clearAllConversations,
  updateConversation,
  updateConversationLastActivity,
  addOrUpdateMessage,
  addConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
