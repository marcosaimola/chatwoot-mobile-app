import { fromUnixTime, formatDistanceToNow, isSameDay, format, differenceInDays, startOfDay } from 'date-fns';
import {
  ptBR,
  enUS,
  es,
  fr,
  de,
  it,
  ja,
  ko,
  zhCN,
  ru,
  pl,
  nl,
  sv,
  da,
  fi,
  tr,
  pt,
  ar,
  he,
  id,
  vi,
  cs,
  ro,
  hu,
  ca,
  el,
  uk,
  no,
  fa,
  hi,
  Locale,
} from 'date-fns/locale';
import i18n from '@/i18n';
import { UnixTimestamp } from '@/types';

export const formatRelativeTime = (time: number) => {
  const unixTime = fromUnixTime(time);
  return formatDistanceToNow(unixTime, { addSuffix: true });
};

export const formatTimeToShortForm = (time: string, withAgo = false) => {
  const suffix = withAgo ? ' ago' : '';
  const timeMappings: { [key: string]: string } = {
    'less than a minute ago': 'now',
    'a minute ago': `1m${suffix}`,
    'an hour ago': `1h${suffix}`,
    'a day ago': `1d${suffix}`,
    'a month ago': `1mo${suffix}`,
    'a year ago': `1y${suffix}`,
  };
  // Check if the time string is one of the specific cases
  if (timeMappings[time]) {
    return timeMappings[time];
  }
  const convertToShortTime = time
    .replace(/about|over|almost|/g, '')
    .replace(' minute ago', `m${suffix}`)
    .replace(' minutes ago', `m${suffix}`)
    .replace(' hour ago', `h${suffix}`)
    .replace(' hours ago', `h${suffix}`)
    .replace(' day ago', `d${suffix}`)
    .replace(' days ago', `d${suffix}`)
    .replace(' month ago', `mo${suffix}`)
    .replace(' months ago', `mo${suffix}`)
    .replace(' year ago', `y${suffix}`)
    .replace(' years ago', `y${suffix}`);
  return convertToShortTime;
};

export const formatDate = (date: UnixTimestamp, dateFormat = 'MMM dd, yyyy') => {
  const dateObj = fromUnixTime(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateObj, today)) {
    return i18n.t('CONVERSATION.TODAY');
  }
  if (isSameDay(dateObj, yesterday)) {
    return i18n.t('CONVERSATION.YESTERDAY');
  }
  return format(dateObj, dateFormat);
};

export const unixTimestampToReadableTime = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${formattedHours}:${minutes} ${ampm}`;
};

export const messageStamp = ({
  time,
  dateFormat = 'h:mm a',
}: {
  time: number;
  dateFormat?: string;
}) => {
  const unixTime = fromUnixTime(time);
  return format(unixTime, dateFormat);
};

/**
 * Maps i18n locale to date-fns locale
 */
const getDateFnsLocale = (): Locale => {
  const i18nLocale = i18n.locale || 'en';
  const localeMap: { [key: string]: Locale } = {
    pt_BR: ptBR,
    pt: pt,
    en: enUS,
    es: es,
    fr: fr,
    de: de,
    it: it,
    ja: ja,
    ko: ko,
    zh_CN: zhCN,
    zh: zhCN,
    ru: ru,
    pl: pl,
    nl: nl,
    sv: sv,
    da: da,
    fi: fi,
    tr: tr,
    ar: ar,
    he: he,
    id: id,
    vi: vi,
    cs: cs,
    ro: ro,
    hu: hu,
    ca: ca,
    el: el,
    uk: uk,
    no: no,
    fa: fa,
    hi: hi,
  };
  return localeMap[i18nLocale] || enUS;
};

/**
 * Gets date format based on locale
 * pt_BR and most locales use DD/MM/YYYY, en uses MM/DD/YYYY
 */
const getDateFormat = (): string => {
  const i18nLocale = i18n.locale || 'en';
  // US format uses MM/DD/YYYY
  if (i18nLocale === 'en') {
    return 'MM/dd/yyyy';
  }
  // Most other locales use DD/MM/YYYY
  return 'dd/MM/yyyy';
};

/**
 * Formats timestamp in WhatsApp Business style:
 * - Today: shows time (e.g., "11:06")
 * - Yesterday: shows translated "yesterday" (e.g., "ontem", "ayer", "yesterday")
 * - Up to 5 days ago: shows weekday in current locale (e.g., "terça-feira", "martes", "tuesday")
 * - Older: shows date in locale format (e.g., "10/01/2026" for pt_BR, "01/10/2026" for en)
 */
export const formatWhatsAppStyleTime = (timestamp: number): string => {
  const messageDate = fromUnixTime(timestamp);
  const today = startOfDay(new Date());
  const messageDay = startOfDay(messageDate);
  const daysDiff = differenceInDays(today, messageDay);
  const locale = getDateFnsLocale();
  const dateFormat = getDateFormat();

  // Today: show time
  if (daysDiff === 0) {
    return format(messageDate, 'HH:mm');
  }

  // Yesterday: show translated "yesterday"
  if (daysDiff === 1) {
    return i18n.t('CONVERSATION.YESTERDAY');
  }

  // Up to 5 days ago: show weekday in current locale
  if (daysDiff <= 5) {
    return format(messageDate, 'EEEE', { locale });
  }

  // Older: show date in locale format
  return format(messageDate, dateFormat, { locale });
};
