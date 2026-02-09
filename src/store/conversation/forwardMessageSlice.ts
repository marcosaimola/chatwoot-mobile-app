import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { Message, Contact } from '@/types';

interface ForwardMessageState {
  isForwardMode: boolean;
  selectedMessages: {
    [key: number]: Message;
  };
  selectedContacts: {
    [key: number]: Contact;
  };
  forwardMessage: string;
  selectedInboxId: number | null;
  showInboxSelector: boolean;
}

const initialState: ForwardMessageState = {
  isForwardMode: false,
  selectedMessages: {},
  selectedContacts: {},
  forwardMessage: '',
  selectedInboxId: null,
  showInboxSelector: false,
};

const forwardMessageSlice = createSlice({
  name: 'forwardMessage',
  initialState,
  reducers: {
    enterForwardMode: (state, action: PayloadAction<Message>) => {
      state.isForwardMode = true;
      state.selectedMessages = { [action.payload.id]: action.payload };
    },
    exitForwardMode: state => {
      state.isForwardMode = false;
      state.selectedMessages = {};
      state.selectedContacts = {};
      state.forwardMessage = '';
      state.selectedInboxId = null;
    },
    toggleMessageSelection: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const id = message.id;

      if (id in state.selectedMessages) {
        const { [id]: removed, ...rest } = state.selectedMessages;
        state.selectedMessages = rest;
      } else {
        state.selectedMessages[id] = message;
      }
    },
    toggleContactSelection: (state, action: PayloadAction<Contact>) => {
      const contact = action.payload;
      const id = contact.id;

      if (id in state.selectedContacts) {
        const { [id]: removed, ...rest } = state.selectedContacts;
        state.selectedContacts = rest;
      } else {
        state.selectedContacts[id] = contact;
      }
    },
    clearContactSelection: state => {
      state.selectedContacts = {};
    },
    setForwardMessage: (state, action: PayloadAction<string>) => {
      state.forwardMessage = action.payload;
    },
    setSelectedInboxId: (state, action: PayloadAction<number>) => {
      state.selectedInboxId = action.payload;
    },
    setShowInboxSelector: (state, action: PayloadAction<boolean>) => {
      state.showInboxSelector = action.payload;
    },
    clearForwardState: () => initialState,
  },
});

// Selectors
export const selectIsForwardMode = (state: RootState) => state.forwardMessage.isForwardMode;

export const selectSelectedMessages = (state: RootState) => state.forwardMessage.selectedMessages;

export const selectSelectedContacts = (state: RootState) => state.forwardMessage.selectedContacts;

export const selectForwardMessageText = (state: RootState) => state.forwardMessage.forwardMessage;

export const selectSelectedInboxId = (state: RootState) => state.forwardMessage.selectedInboxId;

export const selectShowInboxSelector = (state: RootState) => state.forwardMessage.showInboxSelector;

export const selectSelectedMessageIds = createSelector([selectSelectedMessages], selected =>
  Object.keys(selected).map(Number),
);

export const selectSelectedMessagesArray = createSelector([selectSelectedMessages], selected =>
  Object.values(selected),
);

export const selectSelectedMessagesCount = createSelector(
  [selectSelectedMessages],
  selected => Object.keys(selected).length,
);

export const selectIsMessageSelected = createSelector(
  [selectSelectedMessages, (_state: RootState, messageId: number) => messageId],
  (selected, messageId) => messageId in selected,
);

export const selectSelectedContactsArray = createSelector([selectSelectedContacts], selected =>
  Object.values(selected),
);

export const selectSelectedContactsCount = createSelector(
  [selectSelectedContacts],
  selected => Object.keys(selected).length,
);

export const selectIsContactSelected = createSelector(
  [selectSelectedContacts, (_state: RootState, contactId: number) => contactId],
  (selected, contactId) => contactId in selected,
);

export const {
  enterForwardMode,
  exitForwardMode,
  toggleMessageSelection,
  toggleContactSelection,
  clearContactSelection,
  setForwardMessage,
  setSelectedInboxId,
  setShowInboxSelector,
  clearForwardState,
} = forwardMessageSlice.actions;

export default forwardMessageSlice.reducer;
