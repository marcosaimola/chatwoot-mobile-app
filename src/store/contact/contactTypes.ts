import { Conversation } from '@/types';
export interface ContactLabelsAPIResponse {
  payload: string[];
}

export interface ContactLabelsPayload {
  contactId: number;
}

export interface UpdateContactLabelsPayload {
  contactId: number;
  labels: string[];
}

export interface ContactConversationPayload {
  contactId: number;
}

export interface ContactConversationAPIResponse {
  payload: Conversation[];
}

export interface SearchContactsPayload {
  page?: number;
  q?: string;
  sort?: string;
  include_contact_inboxes?: boolean;
}

export interface SearchContactsAPIResponse {
  meta: {
    count: number;
    current_page: string;
  };
  payload: Array<{
    additional_attributes: Record<string, any>;
    availability_status: string;
    email: string | null;
    id: number;
    name: string;
    phone_number: string | null;
    blocked: boolean;
    identifier: string | null;
    thumbnail: string;
    custom_attributes: Record<string, any>;
    last_activity_at: number;
    created_at: number;
  }>;
}

export interface ContactNote {
  id: number;
  content: string;
  account_id: number | null;
  contact_id: number | null;
  user: {
    id: number;
    account_id: number;
    availability_status: string;
    auto_offline: boolean;
    confirmed: boolean;
    email: string;
    available_name: string;
    name: string;
    role: string;
    thumbnail: string;
    custom_role_id: number | null;
    can_view_unassigned_conversations: boolean;
    can_view_all_conversations: boolean;
  };
  created_at: number;
  updated_at: number;
}

export interface GetContactNotesPayload {
  contactId: number;
}

export interface CreateContactNotePayload {
  contactId: number;
  content: string;
}
