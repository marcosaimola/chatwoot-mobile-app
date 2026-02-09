import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contact } from '@/types/Contact';
import { RootState } from '@/store';

const MAX_RECENT_CONTACTS = 10;

interface RecentContactsState {
  contacts: Contact[];
}

const initialState: RecentContactsState = {
  contacts: [],
};

const recentContactsSlice = createSlice({
  name: 'recentContacts',
  initialState,
  reducers: {
    addRecentContact: (state, action: PayloadAction<Contact>) => {
      const contact = action.payload;
      // Remove if already exists
      state.contacts = state.contacts.filter(c => c.id !== contact.id);
      // Add to beginning
      state.contacts.unshift(contact);
      // Keep only MAX_RECENT_CONTACTS
      if (state.contacts.length > MAX_RECENT_CONTACTS) {
        state.contacts = state.contacts.slice(0, MAX_RECENT_CONTACTS);
      }
    },
    addRecentContacts: (state, action: PayloadAction<Contact[]>) => {
      const newContacts = action.payload;
      // Add each contact to the beginning
      newContacts.forEach(contact => {
        state.contacts = state.contacts.filter(c => c.id !== contact.id);
        state.contacts.unshift(contact);
      });
      // Keep only MAX_RECENT_CONTACTS
      if (state.contacts.length > MAX_RECENT_CONTACTS) {
        state.contacts = state.contacts.slice(0, MAX_RECENT_CONTACTS);
      }
    },
    removeRecentContact: (state, action: PayloadAction<number>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    },
    clearRecentContacts: state => {
      state.contacts = [];
    },
  },
});

export const { 
  addRecentContact, 
  addRecentContacts, 
  removeRecentContact, 
  clearRecentContacts 
} = recentContactsSlice.actions;

// Selectors
export const selectRecentContacts = (state: RootState) => state.recentContacts.contacts;
export const selectHasRecentContacts = (state: RootState) => state.recentContacts.contacts.length > 0;

export default recentContactsSlice.reducer;
