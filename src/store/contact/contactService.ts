import { apiService } from '@/services/APIService';
import type { AxiosRequestConfig } from 'axios';
import type {
  ContactLabelsAPIResponse,
  ContactLabelsPayload,
  UpdateContactLabelsPayload,
  ContactConversationAPIResponse,
  ContactConversationPayload,
  SearchContactsPayload,
  SearchContactsAPIResponse,
  GetContactNotesPayload,
  CreateContactNotePayload,
  ContactNote,
} from './contactTypes';
import { transformConversation } from '@/utils/camelCaseKeys';

export class ContactService {
  static async getContactLabels(payload: ContactLabelsPayload) {
    const { contactId } = payload;
    const response = await apiService.get<ContactLabelsAPIResponse>(`contacts/${contactId}/labels`);
    return response.data;
  }

  static async updateContactLabels(
    payload: UpdateContactLabelsPayload,
  ): Promise<ContactLabelsAPIResponse> {
    const { contactId, labels } = payload;
    const response = await apiService.put<ContactLabelsAPIResponse>(
      `contacts/${contactId}/labels`,
      { labels },
    );
    return response.data;
  }

  static async getContactConversations(
    payload: ContactConversationPayload,
  ): Promise<ContactConversationAPIResponse> {
    const { contactId } = payload;
    const response = await apiService.get<ContactConversationAPIResponse>(
      `contacts/${contactId}/conversations`,
    );
    const transformedResponse = response.data.payload.map(transformConversation);
    return {
      payload: transformedResponse,
    };
  }

  static async searchContacts(
    payload: SearchContactsPayload,
    config?: AxiosRequestConfig & { skipErrorToast?: boolean },
  ): Promise<SearchContactsAPIResponse> {
    const { page = 1, q, sort = 'name', include_contact_inboxes = false } = payload;
    const params = new URLSearchParams({
      page: page.toString(),
      sort,
      include_contact_inboxes: include_contact_inboxes.toString(),
    });
    
    // Use /contacts/search endpoint when there's a search query
    // Use /contacts endpoint for listing all contacts
    let endpoint = 'contacts';
    if (q && q.trim()) {
      endpoint = 'contacts/search';
      params.append('q', q.trim());
    }

    const response = await apiService.get<SearchContactsAPIResponse>(
      `${endpoint}?${params.toString()}`,
      config,
    );
    return response.data;
  }

  static async getContactNotes(payload: GetContactNotesPayload): Promise<ContactNote[]> {
    const { contactId } = payload;
    const response = await apiService.get<ContactNote[]>(`contacts/${contactId}/notes`);
    return response.data;
  }

  static async createContactNote(payload: CreateContactNotePayload): Promise<ContactNote> {
    const { contactId, content } = payload;
    const response = await apiService.post<ContactNote>(`contacts/${contactId}/notes`, { content });
    return response.data;
  }
}
