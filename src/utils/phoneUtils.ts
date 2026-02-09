/**
 * Phone number utilities for E.164 normalization
 * E.164 format: +[country code][number] (e.g., +5511999999999)
 */

/**
 * Removes all non-numeric characters from a phone number
 */
function removeNonNumeric(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes a phone number to E.164 format (+[country code][number])
 * 
 * @param phone - Phone number in any format
 * @param defaultCountryCode - Default country code to use if not present (default: '55' for Brazil)
 * @returns Normalized phone number in E.164 format or empty string if invalid
 * 
 * @example
 * normalizeToE164('11999999999') => '+5511999999999'
 * normalizeToE164('+5511999999999') => '+5511999999999'
 * normalizeToE164('(11) 99999-9999') => '+5511999999999'
 * normalizeToE164('5511999999999') => '+5511999999999'
 */
export function normalizeToE164(phone: string, defaultCountryCode: string = '55'): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-numeric characters
  const digits = removeNonNumeric(phone);

  if (digits.length === 0) {
    return '';
  }

  let normalized = '';

  // Already has Brazil country code (55 + 10 or 11 digits = 12 or 13 total)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    normalized = `+${digits}`;
  }
  // Brazilian number without country code
  // 10 digits: DDD (2) + landline (8) - e.g., 11 3456-7890
  // 11 digits: DDD (2) + mobile with 9 (9) - e.g., 11 99999-9999
  else if (digits.length === 10 || digits.length === 11) {
    normalized = `+${defaultCountryCode}${digits}`;
  }
  // Number with some country code (13+ digits or starts with known codes)
  else if (digits.length >= 12) {
    // Assume it already has a country code
    normalized = `+${digits}`;
  }
  // Short numbers (8-9 digits) - might be local number without DDD
  // We'll add default DDD (11 for São Paulo) + country code
  else if (digits.length === 8 || digits.length === 9) {
    // 8 digits = landline without DDD
    // 9 digits = mobile without DDD
    // We can't reliably determine the DDD, so we'll skip these
    // or add a default DDD - for now, let's accept them with a generic approach
    // Adding default DDD 11 (São Paulo) - this may not be accurate but better than rejecting
    normalized = `+${defaultCountryCode}11${digits}`;
  }
  // Too short or too long - reject
  else {
    return '';
  }

  // Validate the result (E.164: + followed by 7-15 digits)
  // More lenient validation to accept international numbers
  const e164LenientRegex = /^\+[1-9]\d{6,14}$/;
  if (e164LenientRegex.test(normalized)) {
    return normalized;
  }

  return '';
}

/**
 * Validates if a phone number is in E.164 format
 * E.164: + followed by 7-15 digits (more lenient to accept various international formats)
 * 
 * @param phone - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // E.164 format: +[7-15 digits] - lenient to accept various international formats
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone);
}

/**
 * Formats a phone number for display (Brazilian format)
 * 
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number for display
 * 
 * @example
 * formatForDisplay('+5511999999999') => '(11) 99999-9999'
 */
export function formatForDisplay(phone: string): string {
  if (!phone || !isValidE164(phone)) {
    return phone;
  }

  // Remove + and country code (assuming Brazil +55)
  const digits = phone.replace(/^\+55/, '');

  if (digits.length === 10) {
    // Format: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    // Format: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Return as is if doesn't match expected format
  return phone;
}

/**
 * Extracts country code from E.164 phone number
 * 
 * @param phone - Phone number in E.164 format
 * @returns Country code or empty string
 */
export function extractCountryCode(phone: string): string {
  if (!phone || !phone.startsWith('+')) {
    return '';
  }

  // E.164 country codes are 1-3 digits
  const withoutPlus = phone.slice(1);
  
  // Try to match common country codes
  if (withoutPlus.startsWith('55')) return '55'; // Brazil
  if (withoutPlus.startsWith('1')) return '1'; // US/Canada
  if (withoutPlus.startsWith('44')) return '44'; // UK
  if (withoutPlus.startsWith('33')) return '33'; // France
  if (withoutPlus.startsWith('49')) return '49'; // Germany
  
  // Default: assume first 1-3 digits are country code
  // This is a simplification - real implementation would need a full country code database
  return withoutPlus.slice(0, Math.min(3, withoutPlus.length));
}
