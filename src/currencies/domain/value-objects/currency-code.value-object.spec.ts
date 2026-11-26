import { UnsupportedCurrencyError } from '../errors/currency.errors';
import {
  CurrencyCode,
  SUPPORTED_CURRENCY_CODES,
} from './currency-code.value-object';

describe('CurrencyCode', () => {
  it.each(SUPPORTED_CURRENCY_CODES)(
    'accepts the supported currency %s',
    (currencyCode) => {
      expect(CurrencyCode.create(currencyCode).value).toBe(currencyCode);
    },
  );

  it('normalizes the currency code', () => {
    expect(CurrencyCode.create(' usd ').value).toBe('USD');
  });

  it('rejects unsupported currencies', () => {
    expect(() => CurrencyCode.create('EUR')).toThrow(UnsupportedCurrencyError);
  });
});
