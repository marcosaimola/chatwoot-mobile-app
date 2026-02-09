import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContactNote } from './contactTypes';
import { contactNotesActions } from './contactNotesActions';

interface ContactNotesState {
  notesByContactId: Record<number, ContactNote[]>;
  isLoading: Record<number, boolean>;
  error: Record<number, string | null>;
}

const initialState: ContactNotesState = {
  notesByContactId: {},
  isLoading: {},
  error: {},
};

const contactNotesSlice = createSlice({
  name: 'contactNotes',
  initialState,
  reducers: {
    clearContactNotes: (state, action: PayloadAction<number>) => {
      const contactId = action.payload;
      delete state.notesByContactId[contactId];
      delete state.isLoading[contactId];
      delete state.error[contactId];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(contactNotesActions.getContactNotes.pending, (state, action) => {
        const contactId = action.meta.arg.contactId;
        state.isLoading[contactId] = true;
        state.error[contactId] = null;
      })
      .addCase(contactNotesActions.getContactNotes.fulfilled, (state, action) => {
        const { contactId, notes } = action.payload;
        state.notesByContactId[contactId] = notes;
        state.isLoading[contactId] = false;
        state.error[contactId] = null;
      })
      .addCase(contactNotesActions.getContactNotes.rejected, (state, action) => {
        const contactId = action.meta.arg.contactId;
        state.isLoading[contactId] = false;
        state.error[contactId] = action.payload as string;
      })
      .addCase(contactNotesActions.createContactNote.fulfilled, (state, action) => {
        const { contactId, note } = action.payload;
        if (!state.notesByContactId[contactId]) {
          state.notesByContactId[contactId] = [];
        }
        state.notesByContactId[contactId] = [note, ...state.notesByContactId[contactId]];
      });
  },
});

export const { clearContactNotes } = contactNotesSlice.actions;
export default contactNotesSlice.reducer;
