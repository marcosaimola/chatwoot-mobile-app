import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export const selectContactNotesState = (state: RootState) => state.contactNotes;

export const selectContactNotes = (state: RootState, contactId: number) =>
  state.contactNotes.notesByContactId[contactId] || [];

export const selectIsLoadingContactNotes = (state: RootState, contactId: number) =>
  state.contactNotes.isLoading[contactId] || false;

export const selectContactNotesError = (state: RootState, contactId: number) =>
  state.contactNotes.error[contactId] || null;
