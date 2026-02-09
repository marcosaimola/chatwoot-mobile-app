import { apiService } from './APIService';
import type { AxiosRequestConfig } from 'axios';
import { Contact } from '@/types/Contact';
import { Conversation } from '@/types/Conversation';
import { transformConversation, transformContact } from '@/utils/camelCaseKeys';

/**
 * Types for creating contact
 */
export interface CreateContactPayload {
  name: string;
  phone_number: string;
  email?: string | null;
  identifier?: string;
  additional_attributes?: {
    description?: string;
    company_name?: string;
    country?: string;
    city?: string;
  };
}

/**
 * API response for contact creation
 * Chatwoot returns the contact directly or wrapped in payload
 */
export interface CreateContactAPIResponse {
  id: number;
  name: string;
  email: string | null;
  phone_number: string;
  identifier: string | null;
  thumbnail: string | null;
  additional_attributes: Record<string, unknown>;
  custom_attributes: Record<string, unknown>;
  created_at: number;
  last_activity_at: number;
  // For wrapped responses
  payload?: {
    contact: {
      id: number;
      name: string;
      email: string | null;
      phone_number: string;
      identifier: string | null;
      thumbnail: string | null;
      additional_attributes: Record<string, unknown>;
      custom_attributes: Record<string, unknown>;
      created_at: number;
      last_activity_at: number;
    };
  };
}

export interface CreateContactResponse {
  contact: Contact;
}

/**
 * Types for updating contact
 */
export interface UpdateContactPayload {
  name?: string;
  email?: string | null;
  phone_number?: string;
  identifier?: string | null;
  additional_attributes?: {
    description?: string;
    company_name?: string;
    country_code?: string;
    country?: string;
    city?: string;
    social_profiles?: Record<string, string>;
  };
  custom_attributes?: Record<string, unknown>;
}

/**
 * Types for creating conversation
 * The correct endpoint is POST /conversations with contact_id in the body
 */
export interface CreateConversationMessagePayload {
  content: string;
  template_params?: {
    name: string;
    category: string;
    language: string;
    processed_params?: Record<string, unknown>;
  };
}

export interface CreateConversationPayload {
  inbox_id: number;
  source_id: string;
  contact_id: number;
  message?: CreateConversationMessagePayload;
  assignee_id?: number;
}

export interface CreateConversationAPIResponse {
  id: number;
  account_id: number;
  inbox_id: number;
  status: number;
  can_reply: boolean;
  // ... other fields from API
  [key: string]: unknown;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

/**
 * Service for creating contacts and conversations
 */
export class ContactConversationService {
  /**
   * Create a new contact with phone number
   */
  static async createContact(
    payload: CreateContactPayload,
    config?: AxiosRequestConfig & { skipErrorToast?: boolean },
  ): Promise<CreateContactResponse> {
    const response = await apiService.post<CreateContactAPIResponse>('contacts', payload, config);

    // Handle both direct response and wrapped response formats
    // Chatwoot API can return: { payload: { contact: {...} } }, { payload: {...contact} }, or {...contact}
    let contactData = response.data;
    if (response.data.payload?.contact) {
      contactData = response.data.payload.contact;
    } else if (
      response.data.payload &&
      typeof response.data.payload === 'object' &&
      'id' in response.data.payload
    ) {
      contactData = response.data.payload;
    }

    const contact = transformContact(contactData);

    return { contact };
  }

  /**
   * Create a new conversation for an existing contact
   * Uses POST /conversations endpoint with contact_id in the body
   */
  static async createConversation(
    payload: CreateConversationPayload,
  ): Promise<CreateConversationResponse> {
    const response = await apiService.post<CreateConversationAPIResponse>(
      'conversations',
      payload,
    );

    const conversation = transformConversation(response.data);

    return { conversation };
  }

  /**
   * Update an existing contact
   */
  static async updateContact(
    contactId: number,
    payload: UpdateContactPayload,
  ): Promise<CreateContactResponse> {
    const response = await apiService.patch<CreateContactAPIResponse>(
      `contacts/${contactId}?include_contact_inboxes=false`,
      payload,
    );

    // Handle both direct response and wrapped response formats
    // API can return { payload: { contact: {...} } }, { payload: {...contact} }, or {...contact}
    let contactData = response.data;
    if (response.data.payload?.contact) {
      contactData = response.data.payload.contact;
    } else if (
      response.data.payload &&
      typeof response.data.payload === 'object' &&
      'id' in response.data.payload
    ) {
      contactData = response.data.payload;
    }

    const contact = transformContact(contactData);

    return { contact };
  }

  /**
   * Fetch a single contact by id (GET). Use when opening contact details to get full data including custom_attributes.
   */
  static async getContact(contactId: number): Promise<CreateContactResponse> {
    const response = await apiService.get<CreateContactAPIResponse>(
      `contacts/${contactId}?include_contact_inboxes=false`,
    );

    let contactData = response.data;
    if (response.data.payload?.contact) {
      contactData = response.data.payload.contact;
    } else if (
      response.data.payload &&
      typeof response.data.payload === 'object' &&
      'id' in response.data.payload
    ) {
      contactData = response.data.payload;
    }

    const contact = transformContact(contactData);
    return { contact };
  }

  /**
   * Delete custom attribute values from a contact
   * POST api/v1/accounts/{account_id}/contacts/{contact_id}/destroy_custom_attributes
   * @param contactId - The contact ID
   * @param attributeKeys - Array of attribute keys to delete (snake_case)
   */
  static async destroyCustomAttributes(
    contactId: number,
    attributeKeys: string[],
  ): Promise<CreateContactResponse> {
    const response = await apiService.post<CreateContactAPIResponse, { custom_attributes: string[] }>(
      `contacts/${contactId}/destroy_custom_attributes`,
      { custom_attributes: attributeKeys },
    );

    let contactData = response.data;
    if (response.data.payload?.contact) {
      contactData = response.data.payload.contact;
    } else if (
      response.data.payload &&
      typeof response.data.payload === 'object' &&
      'id' in response.data.payload
    ) {
      contactData = response.data.payload;
    }

    const contact = transformContact(contactData);
    return { contact };
  }

  /**
   * Create contact and conversation in one flow
   * @param phoneNumber - Phone number with country code (e.g., +5511999999999)
   * @param inboxId - The inbox ID to create the conversation in
   * @param assigneeId - Optional assignee ID
   */
  static async createContactAndConversation(
    phoneNumber: string,
    inboxId: number,
    assigneeId?: number,
  ): Promise<{ contact: Contact; conversation: Conversation }> {
    // Step 1: Create contact
    const contactResponse = await this.createContact({
      name: phoneNumber,
      phone_number: phoneNumber,
    });

    // Step 2: Create conversation using POST /conversations
    // source_id should be without the + prefix for WhatsApp
    const sourceId = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    const payload: CreateConversationPayload = {
      inbox_id: inboxId,
      source_id: sourceId,
      contact_id: contactResponse.contact.id,
    };

    if (assigneeId) {
      payload.assignee_id = assigneeId;
    }

    const conversationResponse = await this.createConversation(payload);

    return {
      contact: contactResponse.contact,
      conversation: conversationResponse.conversation,
    };
  }
}
