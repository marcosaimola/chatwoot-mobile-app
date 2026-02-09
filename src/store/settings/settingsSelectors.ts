import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

export const selectSettings = (state: RootState) => state?.settings;

export const selectInstallationUrl = createSelector(
  selectSettings,
  settings => settings.installationUrl,
);

export const selectLocale = createSelector(selectSettings, settings => settings.localeValue);

export const selectIsLocaleSet = createSelector(
  selectSettings,
  settings => settings.uiFlags.isLocaleSet,
);

export const selectIsSettingUrl = createSelector(
  selectSettings,
  settings => settings.uiFlags.isSettingUrl,
);

export const selectBaseUrl = createSelector(selectSettings, settings => settings.baseUrl);

export const selectNotificationSettings = createSelector(
  selectSettings,
  settings => settings.notificationSettings,
);

export const selectWebSocketUrl = createSelector(selectSettings, settings => settings.webSocketUrl);

export const selectTheme = createSelector(selectSettings, settings => settings?.theme ?? 'light');

export const selectIsChatwootCloud = createSelector(selectSettings, settings =>
  settings.installationUrl.includes('app.chatwoot.com'),
);

export const selectChatwootVersion = createSelector(selectSettings, settings => settings.version);

export const selectPushToken = createSelector(selectSettings, settings => settings.pushToken);

/**
 * Selector to check if the current installation is Zenvor or ZapiCrm
 * Used to conditionally show features like AI Agents and Funnel/Kanban
 */
const ALLOWED_CUSTOM_FEATURES_URLS = ['app.zenvor.com.br','atendimento.zapicrm.com.br'];

function normalizeHost(value?: string) {
  if (!value) return '';
  const trimmedValue = value.trim().toLowerCase();
  if (!trimmedValue) return '';
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) {
    try {
      return new URL(trimmedValue).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
  return trimmedValue
    .replace(/^wss?:\/\//i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0]
    .toLowerCase();
}

export const selectIsCustomFeaturesEnabled = createSelector(selectSettings, settings => {
  const baseHost = normalizeHost(settings.baseUrl || settings.installationUrl);
  return ALLOWED_CUSTOM_FEATURES_URLS.some(allowed => normalizeHost(allowed) === baseHost);
});
