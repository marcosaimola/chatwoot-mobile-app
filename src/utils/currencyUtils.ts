/**
 * Formats a number as Brazilian currency (R$).
 * Example: 597 → "R$ 597,00"
 * Example: 1234.5 → "R$ 1.234,50"
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number as Brazilian currency without the "R$" prefix.
 * Example: 597 → "597,00"
 * Example: 1234.5 → "1.234,50"
 */
export function formatCurrencyValue(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a Brazilian currency string to a number.
 * Handles formats like "R$ 597,00", "597,00", "1.234,50".
 * Returns 0 for invalid inputs.
 */
export function parseCurrency(text: string): number {
  if (!text) return 0;

  // Remove "R$", spaces, and dots (thousands separator)
  const cleaned = text
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

/**
 * Applies a currency mask to a raw input string.
 * Keeps only digits and formats as "1.234,56".
 * Returns the masked string for display in TextInput.
 */
export function applyCurrencyMask(text: string): string {
  // Remove everything except digits
  const digits = text.replace(/\D/g, '');

  if (!digits || digits === '0' || digits === '00') return '0,00';

  // Pad with leading zeros if needed (minimum 3 digits for "X,XX")
  const padded = digits.padStart(3, '0');

  // Split into integer and decimal parts
  const integerPart = padded.slice(0, padded.length - 2);
  const decimalPart = padded.slice(padded.length - 2);

  // Remove leading zeros from integer part
  const integerClean = integerPart.replace(/^0+/, '') || '0';

  // Add thousands separator
  const withThousands = integerClean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${withThousands},${decimalPart}`;
}
