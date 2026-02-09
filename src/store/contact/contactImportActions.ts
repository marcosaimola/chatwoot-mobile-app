import { createAsyncThunk } from '@reduxjs/toolkit';
import * as ExpoContacts from 'expo-contacts';
import { ContactConversationService, CreateContactPayload } from '@/services/ContactConversationService';
import { normalizeToE164 } from '@/utils/phoneUtils';
import { addContact } from './contactSlice';
import { ContactService } from './contactService';
import { Contact } from '@/types/Contact';
import { startImport, updateProgress, addImportError, addImportAttempt, finishImport, resetImport } from './contactImportSlice';
import type { AppDispatch } from '@/store';

interface ImportContactResult {
  success: boolean;
  contact?: Contact;
  error?: string;
  contactName: string;
  phoneNumber: string;
}

interface ImportContactsResult {
  imported: number;
  failed: number;
  errors: Array<{ contactName: string; phoneNumber: string; error: string }>;
}

async function fetchExistingContactsFromServer(): Promise<{
  phones: Set<string>;
  emails: Set<string>;
}> {
  const phones = new Set<string>();
  const emails = new Set<string>();
  const MAX_PAGES = 1000;
  let page = 1;
  let totalFetched = 0;
  let totalCount = 0;

  while (page <= MAX_PAGES) {
    const response = await ContactService.searchContacts(
      {
        page,
        include_contact_inboxes: false,
      },
      { skipErrorToast: true },
    );

    const payload = response.payload || [];
    payload.forEach(contact => {
      if (contact.phone_number) {
        const normalizedPhone = normalizeToE164(contact.phone_number);
        if (normalizedPhone) {
          phones.add(normalizedPhone);
        }
      }
      if (contact.email) {
        emails.add(contact.email.toLowerCase().trim());
      }
    });

    totalFetched += payload.length;
    totalCount = response.meta?.count || totalCount;

    if (payload.length === 0) {
      break;
    }

    if (totalCount > 0 && totalFetched >= totalCount) {
      break;
    }

    page += 1;
  }

  if (page > MAX_PAGES && totalCount > totalFetched) {
    console.warn('[ContactImport] Max pages reached while fetching contacts.', {
      totalFetched,
      totalCount,
      maxPages: MAX_PAGES,
    });
  }

  return { phones, emails };
}

/**
 * Process a batch of contacts
 */
async function processBatch(
  batch: Array<{ name: string; phoneNumber: string; email: string | null }>,
  dispatch: AppDispatch,
  existingPhones: Set<string>,
  existingEmails: Set<string>,
  onProgress?: (imported: number, failed: number) => void,
): Promise<ImportContactResult[]> {
  const results: ImportContactResult[] = [];
  let importedCount = 0;
  let failedCount = 0;

  for (const contactData of batch) {
    const normalizedPhone = normalizeToE164(contactData.phoneNumber);
    try {
      // Normalize phone number
      if (!normalizedPhone) {
        // Add failed attempt to state
        dispatch(addImportAttempt({
          contactName: contactData.name,
          phoneNumber: contactData.phoneNumber,
          success: false,
          error: 'Telefone inválido',
        }));

        results.push({
          success: false,
          contactName: contactData.name,
          phoneNumber: contactData.phoneNumber,
          error: 'Telefone inválido',
        });
        failedCount++;
        onProgress?.(importedCount, failedCount);
        continue;
      }

      // Quick check: if already in our Set, skip
      if (existingPhones.has(normalizedPhone)) {
        // Add failed attempt to state
        dispatch(addImportAttempt({
          contactName: contactData.name,
          phoneNumber: normalizedPhone,
          success: false,
          error: 'Contato já existe',
        }));

        results.push({
          success: false,
          contactName: contactData.name,
          phoneNumber: normalizedPhone,
          error: 'Contato já existe',
        });
        failedCount++;
        onProgress?.(importedCount, failedCount);
        continue;
      }

      // Check email if provided
      if (contactData.email && contactData.email.trim()) {
        const normalizedEmail = contactData.email.toLowerCase().trim();
        if (existingEmails.has(normalizedEmail)) {
          // Add failed attempt to state
          dispatch(addImportAttempt({
            contactName: contactData.name,
            phoneNumber: normalizedPhone,
            success: false,
            error: 'Contato já existe',
          }));

          results.push({
            success: false,
            contactName: contactData.name,
            phoneNumber: normalizedPhone,
            error: 'Contato já existe',
          });
          failedCount++;
          onProgress?.(importedCount, failedCount);
          continue;
        }
      }

      // Create contact
      const payload: CreateContactPayload = {
        name: contactData.name || normalizedPhone,
        phone_number: normalizedPhone,
        email: contactData.email || null,
      };

      const result = await ContactConversationService.createContact(payload, { skipErrorToast: true });

      // Add to Redux store
      dispatch(addContact(result.contact));

      // Add to Sets to avoid duplicates in same batch
      existingPhones.add(normalizedPhone);
      if (contactData.email && contactData.email.trim()) {
        existingEmails.add(contactData.email.toLowerCase().trim());
      }

      // Add success attempt to state
      dispatch(addImportAttempt({
        contactName: contactData.name,
        phoneNumber: normalizedPhone,
        success: true,
      }));

      results.push({
        success: true,
        contact: result.contact,
        contactName: contactData.name,
        phoneNumber: normalizedPhone,
      });
      importedCount++;
      onProgress?.(importedCount, failedCount);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      
      // Add failed attempt to state
      dispatch(addImportAttempt({
        contactName: contactData.name,
        phoneNumber: normalizedPhone || contactData.phoneNumber,
        success: false,
        error: errorMessage,
      }));

      results.push({
        success: false,
        contactName: contactData.name,
        phoneNumber: normalizedPhone || contactData.phoneNumber,
        error: errorMessage,
      });
      failedCount++;
      onProgress?.(importedCount, failedCount);
    }
  }

  return results;
}

/**
 * Delay function for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as {
      message?: string;
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    const responseData = err.response?.data;
    if (responseData) {
      if (typeof responseData === 'string') {
        return responseData;
      }

      if (typeof responseData === 'object') {
        const data = responseData as Record<string, unknown>;
        if (typeof data.message === 'string') {
          return data.message;
        }
        if (typeof data.error === 'string') {
          return data.error;
        }
        if (data.errors) {
          if (Array.isArray(data.errors)) {
            const messages = data.errors.filter(item => typeof item === 'string');
            if (messages.length > 0) {
              return messages.join(', ');
            }
          }
          if (typeof data.errors === 'object') {
            const messages = Object.values(data.errors)
              .flat()
              .filter(item => typeof item === 'string');
            if (messages.length > 0) {
              return messages.join(', ');
            }
          }
        }

        try {
          return JSON.stringify(data);
        } catch {
          return 'Erro desconhecido';
        }
      }
    }

    if (typeof err.message === 'string') {
      return err.message;
    }

    if (err.response?.status) {
      return `HTTP ${err.response.status}`;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido';
}

export const contactImportActions = {
  /**
   * Import contacts from device
   */
  importContactsFromDevice: createAsyncThunk<ImportContactsResult, void>('contactImport/importContactsFromDevice', async (_, { dispatch, getState, rejectWithValue }) => {
      try {
        console.log('[ContactImport] Starting import process...');
        
        // Reset import state first
        dispatch(resetImport());

        console.log('[ContactImport] Checking permission with expo-contacts...');

        // Check and request permission using expo-contacts
        let permissionStatus;
        try {
          const { status } = await ExpoContacts.requestPermissionsAsync();
          permissionStatus = status;
          console.log('[ContactImport] Permission status:', permissionStatus);
        } catch (permError) {
          console.error('[ContactImport] Error requesting permission:', permError);
          return rejectWithValue(`Erro ao solicitar permissão: ${permError instanceof Error ? permError.message : String(permError)}`);
        }
        
        if (permissionStatus !== 'granted') {
          return rejectWithValue('Permissão de contatos negada. Habilite nas configurações do dispositivo.');
        }
        
        console.log('[ContactImport] Permission granted, proceeding...');

        // Get existing contacts from Redux store for initial duplicate check
        const state = getState() as any;
        // Check both contactList (contacts page) and contacts (entity adapter from conversations)
        const contactListContacts = state.contactList?.contacts || [];
        const contactEntities = Object.values(state.contacts?.entities || {}) as Contact[];
        // Merge both sources, removing duplicates by ID
        const allContactIds = new Set<number>();
        const existingContactsInStore: Contact[] = [];
        [...contactListContacts, ...contactEntities].forEach((contact: Contact) => {
          if (contact && contact.id && !allContactIds.has(contact.id)) {
            allContactIds.add(contact.id);
            existingContactsInStore.push(contact);
          }
        });
        
        let existingPhones = new Set<string>();
        let existingEmails = new Set<string>();

        try {
          const serverContacts = await fetchExistingContactsFromServer();
          existingPhones = serverContacts.phones;
          existingEmails = serverContacts.emails;
        } catch (fetchError) {
          console.warn('[ContactImport] Failed to fetch existing contacts from server. Falling back to store.', fetchError);
          existingPhones = new Set(
            existingContactsInStore
              .map(c => c.phoneNumber ? normalizeToE164(c.phoneNumber) : null)
              .filter((p): p is string => p !== null)
          );
          existingEmails = new Set(
            existingContactsInStore
              .map(c => c.email ? c.email.toLowerCase().trim() : null)
              .filter((e): e is string => e !== null)
          );
        }

        // Get all contacts fresh from device (always fetch new, don't cache)
        console.log('[ContactImport] Fetching contacts from device...');
        let contactsData;
        try {
          const { data } = await ExpoContacts.getContactsAsync({
            fields: [
              ExpoContacts.Fields.Name,
              ExpoContacts.Fields.FirstName,
              ExpoContacts.Fields.LastName,
              ExpoContacts.Fields.PhoneNumbers,
              ExpoContacts.Fields.Emails,
            ],
          });
          contactsData = data;
          console.log('[ContactImport] Fetched contacts:', contactsData?.length || 0);
        } catch (contactsError) {
          const errorMsg = contactsError instanceof Error ? contactsError.message : String(contactsError);
          console.error('[ContactImport] Error fetching contacts from device:', contactsError);
          return rejectWithValue(`Erro ao acessar contatos do dispositivo: ${errorMsg}`);
        }

        if (!contactsData || contactsData.length === 0) {
          return rejectWithValue('Nenhum contato encontrado no dispositivo');
        }
        
        // Convert expo-contacts format to our format
        const contacts = contactsData;

        // Filter and normalize contacts, and pre-filter duplicates
        const contactsToImport: Array<{
          name: string;
          phoneNumber: string;
          email: string | null;
        }> = [];

        let contactsWithPhone = 0;
        let contactsAlreadyExist = 0;
        let contactsInvalidPhone = 0;

        for (const contact of contacts) {
          // Get first phone number (expo-contacts uses 'number' property)
          const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
            ? contact.phoneNumbers[0].number
            : null;

          if (!phoneNumber) {
            continue; // Skip contacts without phone numbers
          }

          contactsWithPhone++;

          // Normalize phone number
          const normalizedPhone = normalizeToE164(phoneNumber);
          if (!normalizedPhone) {
            contactsInvalidPhone++;
            continue; // Skip invalid phone numbers
          }

          // Pre-filter: check if already exists
          if (existingPhones.has(normalizedPhone)) {
            contactsAlreadyExist++;
            continue; // Skip duplicate phone
          }

          // Get first email (expo-contacts uses 'email' property directly)
          const email = contact.emails && contact.emails.length > 0
            ? contact.emails[0].email
            : null;

          // Pre-filter: check if email already exists
          if (email && email.trim() && existingEmails.has(email.toLowerCase().trim())) {
            contactsAlreadyExist++;
            continue; // Skip duplicate email
          }

          // Build contact name (expo-contacts has firstName, lastName, name)
          const name = contact.firstName && contact.lastName
            ? `${contact.firstName} ${contact.lastName}`.trim()
            : contact.firstName || contact.lastName || contact.name || 'Sem nome';

          contactsToImport.push({
            name,
            phoneNumber,
            email,
          });
        }

        // Sort contacts by name to process in a predictable order
        contactsToImport.sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
        );

        // Log import statistics for debugging
        console.log('Import stats:', {
          totalDeviceContacts: contacts.length,
          contactsWithPhone,
          contactsInvalidPhone,
          contactsAlreadyExist,
          contactsToImport: contactsToImport.length,
          existingPhonesLookup: existingPhones.size,
          existingEmailsLookup: existingEmails.size,
        });

        if (contactsToImport.length === 0) {
          let message = `Nenhum contato novo para importar. `;
          if (contactsAlreadyExist > 0) {
            message += `${contactsAlreadyExist} contato(s) já existe(m) no sistema. `;
          }
          if (contactsInvalidPhone > 0) {
            message += `${contactsInvalidPhone} contato(s) com telefone inválido.`;
          }
          return rejectWithValue(message.trim());
        }

        // Start import
        dispatch(startImport({ totalContacts: contactsToImport.length }));

        // Process in batches
        const BATCH_SIZE = 10;
        const BATCH_DELAY = 200; // ms between batches
        const allResults: ImportContactResult[] = [];
        let totalImported = 0;
        let totalFailed = 0;

        for (let i = 0; i < contactsToImport.length; i += BATCH_SIZE) {
          const batch = contactsToImport.slice(i, i + BATCH_SIZE);
          const currentContactName = batch[0]?.name || null;
          const batchStartImported = totalImported;
          const batchStartFailed = totalFailed;

          // Update progress with current contact name
          dispatch(
            updateProgress({
              importedCount: totalImported,
              failedCount: totalFailed,
              currentContactName,
            }),
          );

          // Process batch
          const batchResults = await processBatch(
            batch,
            dispatch,
            existingPhones,
            existingEmails,
            (batchImported, batchFailed) => {
              // Accumulate: batch counts + previous totals
              totalImported = batchStartImported + batchImported;
              totalFailed = batchStartFailed + batchFailed;
              dispatch(
                updateProgress({
                  importedCount: totalImported,
                  failedCount: totalFailed,
                  currentContactName,
                }),
              );
            },
          );

          allResults.push(...batchResults);

          // Add errors to state
          batchResults.forEach(result => {
            if (!result.success && result.error) {
              dispatch(
                addImportError({
                  contactName: result.contactName,
                  phoneNumber: result.phoneNumber,
                  error: result.error,
                }),
              );
            }
          });

          // Delay between batches (except for the last batch)
          if (i + BATCH_SIZE < contactsToImport.length) {
            await delay(BATCH_DELAY);
          }
        }

        // Finish import
        dispatch(finishImport());

        const errors = allResults
          .filter(r => !r.success)
          .map(r => ({
            contactName: r.contactName,
            phoneNumber: r.phoneNumber,
            error: r.error || 'Erro desconhecido',
          }));

        return {
          imported: totalImported,
          failed: totalFailed,
          errors,
        };
      } catch (error) {
        console.error('[ContactImport] Unexpected error:', error);
        dispatch(finishImport());
        
        // Get detailed error message
        let errorMessage = 'Erro ao importar contatos';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error);
        }
        
        return rejectWithValue(errorMessage);
      }
    },
  ),
};
