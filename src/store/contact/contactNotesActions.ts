import { createAsyncThunk } from '@reduxjs/toolkit';
import { ContactService } from './contactService';
import { GetContactNotesPayload, CreateContactNotePayload, ContactNote } from './contactTypes';

export const contactNotesActions = {
  getContactNotes: createAsyncThunk<
    {
      contactId: number;
      notes: ContactNote[];
    },
    GetContactNotesPayload
  >('contact/getContactNotes', async (payload, { rejectWithValue }) => {
    try {
      const notes = await ContactService.getContactNotes(payload);
      return {
        contactId: payload.contactId,
        notes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      return rejectWithValue(message);
    }
  }),

  createContactNote: createAsyncThunk<
    {
      contactId: number;
      note: ContactNote;
    },
    CreateContactNotePayload
  >('contact/createContactNote', async (payload, { rejectWithValue }) => {
    try {
      const note = await ContactService.createContactNote(payload);
      return {
        contactId: payload.contactId,
        note,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      return rejectWithValue(message);
    }
  }),
};
