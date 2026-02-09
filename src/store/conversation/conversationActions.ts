import { createAsyncThunk } from '@reduxjs/toolkit';
import { ConversationService } from './conversationService';
import { ContactConversationService } from '@/services/ContactConversationService';
import type {
  ConversationResponse,
  ConversationPayload,
  ApiErrorResponse,
  MessagesPayload,
  MessagesResponse,
  ConversationListResponse,
  ToggleConversationStatusPayload,
  BulkActionPayload,
  AssigneePayload,
  AssignTeamPayload,
  AssignTeamAPIResponse,
  AssigneeAPIResponse,
  MarkMessagesUnreadPayload,
  MarkMessageReadPayload,
  MarkMessageReadOrUnreadResponse,
  MuteOrUnmuteConversationPayload,
  ConversationLabelPayload,
  DeleteMessagePayload,
  DeleteMessageAPIResponse,
  TypingPayload,
  ToggleConversationStatusResponse,
  SendMessageAPIResponse,
  SendMessagePayload,
  TogglePriorityPayload,
  SearchPayload,
  SearchContactsAPIResponse,
  SearchConversationsAPIResponse,
  CreateConversationFromPhonePayload,
  CreateConversationFromPhoneResponse,
  CreateConversationForContactPayload,
  CreateConversationForContactResponse,
} from './conversationTypes';
import { AxiosError } from 'axios';
import { MESSAGE_STATUS } from '@/constants';
import { buildCreatePayload, createPendingMessage } from '@/utils/messageUtils';
import { transformMessage } from '@/utils/camelCaseKeys';
import { Platform } from 'react-native';
import type { RootState } from '@/store';
import { selectConversationById } from './conversationSelectors';
import { selectUserId } from '@/store/auth/authSelectors';

export const conversationActions = {
  fetchConversations: createAsyncThunk<ConversationListResponse, ConversationPayload>(
    'conversations/fetchConversations',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.getConversations(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  fetchConversation: createAsyncThunk<ConversationResponse, number>(
    'conversations/fetchConversation',
    async (conversationId, { rejectWithValue }) => {
      try {
        return await ConversationService.fetchConversation(conversationId);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  fetchPreviousMessages: createAsyncThunk<MessagesResponse, MessagesPayload>(
    'conversations/fetchPreviousMessages',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.fetchPreviousMessages(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  sendMessage: createAsyncThunk<SendMessageAPIResponse, SendMessagePayload>(
    'conversations/sendMessage',
    async (sendMessagePayload, { dispatch, getState, rejectWithValue }) => {
      const { conversationId } = sendMessagePayload;
      const pendingMessage = createPendingMessage(sendMessagePayload);

      try {
        dispatch({
          type: 'conversation/addOrUpdateMessage',
          payload: {
            ...pendingMessage,
            status: MESSAGE_STATUS.PROGRESS,
          },
        });
        const payload = buildCreatePayload(pendingMessage);
        const { file, files } = sendMessagePayload;
        const hasFiles = file || (files && files.length > 0);
        const contentType =
          Platform.OS === 'ios' && hasFiles
            ? (file?.type || files?.[0]?.type || 'multipart/form-data')
            : Platform.OS === 'android' && hasFiles
              ? 'multipart/form-data'
              : 'application/json';

        const response = await ConversationService.sendMessage(conversationId, payload, {
          headers: {
            'Content-Type': contentType,
          },
        });

        const camelCaseMessage = transformMessage(response);

        dispatch({
          type: 'conversation/addOrUpdateMessage',
          payload: {
            ...camelCaseMessage,
            status: MESSAGE_STATUS.SENT,
          },
        });

        // Auto-assign conversation to current user if not already assigned to them
        const state = getState() as RootState;
        const currentUserId = selectUserId(state);
        const conversation = selectConversationById(state, conversationId);

        if (currentUserId && conversation) {
          const assigneeId = conversation.meta?.assignee?.id;

          // If conversation is unassigned or assigned to someone else, assign to current user
          if (!assigneeId || assigneeId !== currentUserId) {
            try {
              await ConversationService.assignConversation({
                conversationId,
                assigneeId: currentUserId,
              });
            } catch (assignError) {
              // Silently fail assignment - message was sent successfully
              console.warn('Auto-assignment failed:', assignError);
            }
          }
        }

        return response;
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        const errorMessage = response?.data?.errors?.[0];
        dispatch({
          type: 'conversation/addOrUpdateMessage',
          payload: {
            ...pendingMessage,
            meta: {
              error: errorMessage,
            },
            status: MESSAGE_STATUS.FAILED,
          },
        });
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  toggleConversationStatus: createAsyncThunk<
    ToggleConversationStatusResponse,
    ToggleConversationStatusPayload
  >('conversations/toggleConversationStatus', async (payload, { rejectWithValue }) => {
    try {
      return await ConversationService.toggleConversationStatus(payload);
    } catch (error) {
      const { response } = error as AxiosError<ApiErrorResponse>;
      if (!response) {
        throw error;
      }
      return rejectWithValue(response.data);
    }
  }),
  bulkAction: createAsyncThunk<void, BulkActionPayload>(
    'conversations/bulkAction',
    async (payload, { rejectWithValue }) => {
      await ConversationService.bulkAction(payload);
    },
  ),
  assignConversation: createAsyncThunk<AssigneeAPIResponse, AssigneePayload>(
    'conversations/assignConversation',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.assignConversation(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  assignTeam: createAsyncThunk<AssignTeamAPIResponse, AssignTeamPayload>(
    'conversations/assignTeam',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.assignTeam(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  markMessagesUnread: createAsyncThunk<
    MarkMessageReadOrUnreadResponse,
    MarkMessagesUnreadPayload,
    { rejectValue: ApiErrorResponse }
  >('conversations/markMessagesUnread', async (payload, { rejectWithValue }) => {
    try {
      return await ConversationService.markMessagesUnread(payload);
    } catch (error) {
      const { response } = error as AxiosError<ApiErrorResponse>;
      if (!response) {
        throw error;
      }
      return rejectWithValue(response.data);
    }
  }),
  markMessageRead: createAsyncThunk<
    MarkMessageReadOrUnreadResponse,
    MarkMessageReadPayload,
    { rejectValue: ApiErrorResponse }
  >('conversations/markMessageRead', async (payload, { rejectWithValue }) => {
    try {
      return await ConversationService.markMessageRead(payload);
    } catch (error) {
      const { response } = error as AxiosError<ApiErrorResponse>;
      if (!response) {
        throw error;
      }
      return rejectWithValue(response.data);
    }
  }),
  muteConversation: createAsyncThunk<
    {
      conversationId: number;
    },
    MuteOrUnmuteConversationPayload
  >('conversations/muteConversation', async (payload, { rejectWithValue }) => {
    await ConversationService.muteConversation(payload);
    return { conversationId: payload.conversationId };
  }),
  unmuteConversation: createAsyncThunk<
    {
      conversationId: number;
    },
    MuteOrUnmuteConversationPayload
  >('conversations/unmuteConversation', async (payload, { rejectWithValue }) => {
    await ConversationService.unmuteConversation(payload);
    return { conversationId: payload.conversationId };
  }),
  addOrUpdateConversationLabels: createAsyncThunk<void, ConversationLabelPayload>(
    'conversations/addOrUpdateConversationLabels',
    async (payload, { rejectWithValue }) => {
      await ConversationService.addOrUpdateConversationLabels(payload);
    },
  ),
  deleteMessage: createAsyncThunk<DeleteMessageAPIResponse, DeleteMessagePayload>(
    'conversations/deleteMessage',
    async (payload, { rejectWithValue }) => {
      return await ConversationService.deleteMessage(payload);
    },
  ),
  toggleTyping: createAsyncThunk<void, TypingPayload>(
    'conversations/toggleTyping',
    async (payload, { rejectWithValue }) => {
      return await ConversationService.toggleTyping(payload);
    },
  ),
  togglePriority: createAsyncThunk<void, TogglePriorityPayload>(
    'conversations/togglePriority',
    async (payload, { rejectWithValue }) => {
      return await ConversationService.togglePriority(payload);
    },
  ),
  searchContacts: createAsyncThunk<SearchContactsAPIResponse, SearchPayload>(
    'conversations/searchContacts',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.searchContacts(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  searchConversations: createAsyncThunk<SearchConversationsAPIResponse, SearchPayload>(
    'conversations/searchConversations',
    async (payload, { rejectWithValue }) => {
      try {
        return await ConversationService.searchConversations(payload);
      } catch (error) {
        const { response } = error as AxiosError<ApiErrorResponse>;
        if (!response) {
          throw error;
        }
        return rejectWithValue(response.data);
      }
    },
  ),
  createConversationFromPhone: createAsyncThunk<
    CreateConversationFromPhoneResponse,
    CreateConversationFromPhonePayload
  >(
    'conversations/createConversationFromPhone',
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const { phoneNumber, inboxId } = payload;

        // Create contact and conversation
        const result = await ContactConversationService.createContactAndConversation(
          phoneNumber,
          inboxId,
        );

        // Add the new conversation to the store
        dispatch({
          type: 'conversation/addConversation',
          payload: result.conversation,
        });

        return {
          conversationId: result.conversation.id,
        };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        if (axiosError.response) {
          return rejectWithValue(axiosError.response.data);
        }
        throw error;
      }
    },
  ),
  createConversationForContact: createAsyncThunk<
    CreateConversationForContactResponse,
    CreateConversationForContactPayload
  >(
    'conversations/createConversationForContact',
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const { phoneNumber, inboxId, contactId } = payload;
        const sourceId = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

        const result = await ContactConversationService.createConversation({
          inbox_id: inboxId,
          source_id: sourceId,
          contact_id: contactId,
        });

        dispatch({
          type: 'conversation/addConversation',
          payload: result.conversation,
        });

        return {
          conversationId: result.conversation.id,
        };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        if (axiosError.response) {
          return rejectWithValue(axiosError.response.data);
        }
        throw error;
      }
    },
  ),
};
