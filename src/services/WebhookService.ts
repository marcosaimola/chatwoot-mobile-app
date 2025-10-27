import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { WEBHOOK_URL } from '@/constants/url';
import { getStore } from '@/store/storeAccessor';

class WebhookService {
  private static instance: WebhookService;
  private api = axios.create({
    baseURL: WEBHOOK_URL,
    timeout: 10000, // 10 segundos
  });

  private constructor() {
    this.setupInterceptors();
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  private getAuthHeaders() {
    const store = getStore();
    const state = store.getState();
    const headers = state.auth.headers;
    const user = state.auth.user;
    if (!headers) return {};

    return {
      'access_token': headers['access-token'], // Mapeando access-token para access_token
      'uid': headers.uid,
      'client': headers.client,
      'user_id': user?.id?.toString() || '',
      'user_email': user?.email || '',
      'user_name': user?.name || '',
      'account_id': user?.account_id?.toString() || '',
    };
  }

  private getConversationId(): string | null {
    const store = getStore();
    const state = store.getState();
    
    // Tentar obter o conversation_id do estado selecionado primeiro
    const selectedConversation = state.conversationSelected?.selectedConversation;
    if (selectedConversation?.id) {
      return selectedConversation.id.toString();
    }
    
    // Se não houver conversa selecionada, tentar obter de outras fontes
    // Isso pode ser expandido conforme necessário
    return null;
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const authHeaders = this.getAuthHeaders();
        config.headers = {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...config.headers,
        };
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('Webhook API Error:', error);
        return Promise.reject(error);
      },
    );
  }

  public async post<T, D = unknown>(endpoint: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.post<T>(endpoint, data, config);
  }

  public async get<T>(endpoint: string, conversationId?: string | number, config?: AxiosRequestConfig) {
    const id = conversationId || this.getConversationId();
    const url = id ? `${endpoint}?conversation_id=${id}` : endpoint;
    return this.api.get<T>(url, config);
  }

  public async put<T, D = unknown>(endpoint: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.put<T>(endpoint, data, config);
  }

  public async patch<T, D = unknown>(endpoint: string, data?: D, config?: AxiosRequestConfig) {
    return this.api.patch<T>(endpoint, data, config);
  }

  public async delete<T>(endpoint: string, config?: AxiosRequestConfig) {
    return this.api.delete<T>(endpoint, config);
  }
}

export const webhookService = WebhookService.getInstance();
