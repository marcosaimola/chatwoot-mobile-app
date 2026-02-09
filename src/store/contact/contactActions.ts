import { createAsyncThunk } from '@reduxjs/toolkit';
import { ContactService } from './contactService';

import { ContactLabelsPayload, SearchContactsPayload, SearchContactsAPIResponse } from './contactTypes';
import { Contact } from '@/types/Contact';

export const contactActions = {
  getContactLabels: createAsyncThunk<
    {
      contactId: number;
      labels: string[];
    },
    ContactLabelsPayload
  >('contact/getContactLabels', async (payload, { rejectWithValue }) => {
    try {
      const response = await ContactService.getContactLabels(payload);
      const { payload: labels } = response.data;
      return { contactId: payload.contactId, labels };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      return rejectWithValue(message);
    }
  }),

  searchContacts: createAsyncThunk<
    {
      contacts: Contact[];
      meta: {
        count: number;
        currentPage: string;
      };
    },
    SearchContactsPayload
  >('contact/searchContacts', async (payload, { rejectWithValue }) => {
    try {
      const response = await ContactService.searchContacts(payload);
      const contacts: Contact[] = response.payload
        .filter(item => item && item.id) // Filter out any undefined or invalid items
        .map(item => ({
          id: item.id,
          name: item.name || null,
          email: item.email || null,
          phoneNumber: item.phone_number || null,
          thumbnail: item.thumbnail || null,
          customAttributes: item.custom_attributes || {},
          additionalAttributes: item.additional_attributes || {},
          availabilityStatus: item.availability_status as any,
          createdAt: item.created_at || 0,
          lastActivityAt: item.last_activity_at || null,
          identifier: item.identifier || null,
          type: 'contact' as const,
        }));
      return {
        contacts,
        meta: {
          count: response.meta.count,
          currentPage: response.meta.current_page,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      return rejectWithValue(message);
    }
  }),
};
