import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContactImportError {
  contactName: string;
  phoneNumber: string;
  error: string;
}

interface ContactImportAttempt {
  contactName: string;
  phoneNumber: string;
  success: boolean;
  error?: string;
}

interface ContactImportState {
  isImporting: boolean;
  progress: number; // 0-100
  totalContacts: number;
  importedCount: number;
  failedCount: number;
  errors: ContactImportError[];
  attempts: ContactImportAttempt[]; // Last 10 attempts
  currentContactName: string | null;
}

const initialState: ContactImportState = {
  isImporting: false,
  progress: 0,
  totalContacts: 0,
  importedCount: 0,
  failedCount: 0,
  errors: [],
  attempts: [],
  currentContactName: null,
};

const contactImportSlice = createSlice({
  name: 'contactImport',
  initialState,
  reducers: {
    startImport: (state, action: PayloadAction<{ totalContacts: number }>) => {
      state.isImporting = true;
      state.totalContacts = action.payload.totalContacts;
      state.progress = 0;
      state.importedCount = 0;
      state.failedCount = 0;
      state.errors = [];
      state.attempts = [];
      state.currentContactName = null;
    },
    updateProgress: (
      state,
      action: PayloadAction<{
        importedCount: number;
        failedCount: number;
        currentContactName?: string | null;
      }>,
    ) => {
      state.importedCount = action.payload.importedCount;
      state.failedCount = action.payload.failedCount;
      if (action.payload.currentContactName !== undefined) {
        state.currentContactName = action.payload.currentContactName;
      }
      
      // Calculate progress percentage
      const totalProcessed = state.importedCount + state.failedCount;
      if (state.totalContacts > 0) {
        state.progress = Math.round((totalProcessed / state.totalContacts) * 100);
      }
    },
    addImportError: (state, action: PayloadAction<ContactImportError>) => {
      state.errors.push(action.payload);
    },
    addImportAttempt: (state, action: PayloadAction<ContactImportAttempt>) => {
      state.attempts.push(action.payload);
      // Keep only last 10 attempts
      if (state.attempts.length > 10) {
        state.attempts = state.attempts.slice(-10);
      }
    },
    finishImport: (state) => {
      state.isImporting = false;
      state.currentContactName = null;
    },
    resetImport: (state) => {
      state.isImporting = false;
      state.progress = 0;
      state.totalContacts = 0;
      state.importedCount = 0;
      state.failedCount = 0;
      state.errors = [];
      state.attempts = [];
      state.currentContactName = null;
    },
  },
});

export const { startImport, updateProgress, addImportError, addImportAttempt, finishImport, resetImport } =
  contactImportSlice.actions;

export default contactImportSlice.reducer;
