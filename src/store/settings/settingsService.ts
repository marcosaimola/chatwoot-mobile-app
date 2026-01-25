import axios from 'axios';
import { apiService } from '@/services/APIService';
import type {
  NotificationSettings,
  NotificationSettingsPayload,
  PushPayload,
  RemoveDevicePayload,
} from './settingsTypes';

export class SettingsService {
  /**
   * Check if the URL is allowed to use the app via external webhook
   */
  static async checkUrlAllowed(url: string): Promise<boolean> {
    try {
      const response = await axios.get<{ allowed: boolean }>(
        `https://webhook.zapicrm.com.br/webhook/9b160143-ddfa-47cb-a10c-095979826bb0?url=${encodeURIComponent(url)}`,
      );
      return response.data.allowed === true;
    } catch {
      return false;
    }
  }

  static async verifyInstallationUrl(url: string): Promise<boolean> {
    try {
      await axios.get(`${url}api`);
      return true;
    } catch {
      return false;
    }
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiService.get<NotificationSettings>('notification_settings');
    return response.data;
  }

  static async updateNotificationSettings(
    payload: NotificationSettingsPayload,
  ): Promise<NotificationSettings> {
    const response = await apiService.put<NotificationSettings>('notification_settings', payload);
    return response.data;
  }

  static async getChatwootVersion(installationUrl: string): Promise<{ version: string }> {
    const response = await axios.get(`${installationUrl}api`);
    return response.data;
  }

  static async saveDeviceDetails(payload: PushPayload): Promise<{ fcmToken: string }> {
    const response = await apiService.post<{ fcmToken: string }>(
      'notification_subscriptions',
      payload,
    );
    return response.data;
  }

  static async removeDevice(payload: RemoveDevicePayload): Promise<void> {
    await apiService.delete('notification_subscriptions', { data: payload });
  }
}
