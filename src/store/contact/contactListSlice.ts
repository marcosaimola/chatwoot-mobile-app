import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contact } from '@/types/Contact';
import { contactActions } from './contactActions';

interface ContactListState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  meta: {
    count: number;
    currentPage: string;
  };
  isAllContactsFetched: boolean;
  searchQuery: string;
  sortBy: string; // 'name' | 'email' | 'city' | 'last_activity_at' | 'created_at'
  sortOrder: 'asc' | 'desc'; // 'asc' = crescente, 'desc' = decrescente
}

const initialState: ContactListState = {
  contacts: [],
  isLoading: false,
  error: null,
  meta: {
    count: 0,
    currentPage: '1',
  },
  isAllContactsFetched: false,
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',
};

const contactListSlice = createSlice({
  name: 'contactList',
  initialState,
  reducers: {
    resetContacts: state => {
      state.contacts = [];
      state.meta = {
        count: 0,
        currentPage: '1',
      };
      state.isAllContactsFetched = false;
      state.error = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(contactActions.searchContacts.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(contactActions.searchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { contacts, meta } = action.payload;
        
        // If it's the first page, replace contacts. Otherwise, append.
        if (meta.currentPage === '1') {
          state.contacts = contacts;
        } else {
          // Avoid duplicates
          const existingIds = new Set(state.contacts.map(c => c.id));
          const newContacts = contacts.filter(c => !existingIds.has(c.id));
          state.contacts = [...state.contacts, ...newContacts];
        }
        
        state.meta = meta;
        
        // Check if all contacts are fetched
        const totalFetched = state.contacts.length;
        state.isAllContactsFetched = totalFetched >= meta.count;
      })
      .addCase(contactActions.searchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetContacts, setSearchQuery, setSortBy, setSortOrder } = contactListSlice.actions;
export default contactListSlice.reducer;
