// Conversation Header Slice is used to manage the header for the conversations screen

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConversationFilterOptions } from '@/types';
import { RootState } from '@/store';
import { conversationActions } from './conversationActions';

export type CurrentState = 'Search' | 'Filter' | 'Select' | 'none';
export type BottomSheetType = ConversationFilterOptions | 'none';

interface ConversationHeaderState {
  currentState: CurrentState;
  searchTerm: string;
  currentBottomSheet: BottomSheetType;
  isSearchingAPI: boolean;
  apiSearchContactIds: number[];
  apiSearchConversationIds: number[];
}

export const initialState: ConversationHeaderState = {
  currentState: 'none',
  searchTerm: '',
  currentBottomSheet: 'none',
  isSearchingAPI: false,
  apiSearchContactIds: [],
  apiSearchConversationIds: [],
};

const conversationHeaderSlice = createSlice({
  name: 'conversationHeader',
  initialState,
  reducers: {
    setCurrentState: (state, action: PayloadAction<CurrentState>) => {
      state.currentState = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      // Clear API search results when search term changes
      state.apiSearchContactIds = [];
      state.apiSearchConversationIds = [];
    },
    setBottomSheetState: (state, action: PayloadAction<BottomSheetType>) => {
      state.currentBottomSheet = action.payload;
    },
    clearApiSearchResults: state => {
      state.apiSearchContactIds = [];
      state.apiSearchConversationIds = [];
      state.isSearchingAPI = false;
    },
  },
  extraReducers: builder => {
    builder
      // Search Contacts
      .addCase(conversationActions.searchContacts.pending, state => {
        state.isSearchingAPI = true;
      })
      .addCase(conversationActions.searchContacts.fulfilled, (state, action) => {
        state.apiSearchContactIds = action.payload.payload.contacts.map(contact => contact.id);
        // Only set isSearchingAPI to false if conversations search is also done
        if (state.apiSearchConversationIds.length > 0 || !state.isSearchingAPI) {
          state.isSearchingAPI = false;
        }
      })
      .addCase(conversationActions.searchContacts.rejected, state => {
        state.apiSearchContactIds = [];
        if (state.apiSearchConversationIds.length > 0 || !state.isSearchingAPI) {
          state.isSearchingAPI = false;
        }
      })
      // Search Conversations
      .addCase(conversationActions.searchConversations.pending, state => {
        state.isSearchingAPI = true;
      })
      .addCase(conversationActions.searchConversations.fulfilled, (state, action) => {
        state.isSearchingAPI = false;
        state.apiSearchConversationIds = action.payload.payload.conversations.map(conv => conv.id);
      })
      .addCase(conversationActions.searchConversations.rejected, state => {
        state.isSearchingAPI = false;
        state.apiSearchConversationIds = [];
      });
  },
});

export const selectCurrentState = (state: RootState) =>
  state.conversationHeader?.currentState ?? 'none';
export const selectSearchTerm = (state: RootState) =>
  state.conversationHeader?.searchTerm ?? '';
export const selectBottomSheetState = (state: RootState) =>
  state.conversationHeader?.currentBottomSheet ?? 'none';
export const selectIsSearchingAPI = (state: RootState) =>
  state.conversationHeader?.isSearchingAPI ?? false;
export const selectApiSearchContactIds = (state: RootState) =>
  state.conversationHeader?.apiSearchContactIds ?? [];
export const selectApiSearchConversationIds = (state: RootState) =>
  state.conversationHeader?.apiSearchConversationIds ?? [];

export const { setCurrentState, setSearchTerm, setBottomSheetState, clearApiSearchResults } =
  conversationHeaderSlice.actions;
export default conversationHeaderSlice.reducer;
