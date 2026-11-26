import { UnsupportedCurrencyError } from '../errors/currency.errors';

export const SUPPORTED_CURRENCY_CODES = ['USD', 'PEN'] as const;
export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

function isSupportedCurrencyCode(
  value: string,
): value is SupportedCurrencyCode {
  return (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(value);
}

export class CurrencyCode {
  private constructor(public readonly value: SupportedCurrencyCode) {}

  static create(value: string): CurrencyCode {
    const normalizedValue = value.trim().toUpperCase();

    if (!isSupportedCurrencyCode(normalizedValue)) {
      throw new UnsupportedCurrencyError(normalizedValue);
    }

    return new CurrencyCode(normalizedValue);
  }
}
