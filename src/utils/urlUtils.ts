import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

interface URLParams {
  URL: string;
}

interface PhoneParams {
  phoneNumber: string;
}

interface EmailParams {
  email: string;
}

export const openURL = ({ URL }: URLParams): void => {
  if (!URL) {
    return;
  }
  WebBrowser.openBrowserAsync(URL);
};

export const openNumber = ({ phoneNumber }: PhoneParams): void => {
  Linking.openURL(`tel:${phoneNumber}`);
};

export const openEmail = ({ email }: EmailParams): void => {
  Linking.openURL(`mailto:${email}`);
};

interface ExtractMainDomainParams {
  domain: string;
}

/**
 * Extracts the main domain from a subdomain
 * Example: atendimento.zapicrm.com.br -> zapicrm.com.br
 * Example: www.example.com -> example.com
 * Example: app.example.com.br -> example.com.br
 */
export const extractMainDomain = ({ domain }: ExtractMainDomainParams): string => {
  if (!domain) {
    return domain;
  }

  // Remove protocol if present
  let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Remove www. prefix if present
  cleanDomain = cleanDomain.replace(/^www\./i, '');

  // Split domain parts
  const parts = cleanDomain.split('.');

  if (parts.length <= 2) {
    // Already a main domain (e.g., example.com)
    return cleanDomain;
  }

  // Check for known two-part TLDs
  const twoPartTlds = ['com.br', 'co.uk', 'com.au', 'co.za', 'com.mx', 'com.ar', 'co.jp'];
  const lastTwoParts = parts.slice(-2).join('.');

  if (twoPartTlds.some(tld => lastTwoParts === tld)) {
    // Domain has a two-part TLD, take last 3 parts
    return parts.slice(-3).join('.');
  }

  // Default: take last 2 parts (domain + TLD)
  return parts.slice(-2).join('.');
};
