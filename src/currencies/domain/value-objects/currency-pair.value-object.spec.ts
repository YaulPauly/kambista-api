import { SameCurrencyPairError } from '../errors/currency.errors';
import { CurrencyPair } from './currency-pair.value-object';

describe('CurrencyPair', () => {
  it('creates a USD/PEN pair', () => {
    const pair = CurrencyPair.create('USD', 'PEN');

    expect(pair.value).toBe('USD/PEN');
    expect(pair.baseCurrency.value).toBe('USD');
    expect(pair.quoteCurrency.value).toBe('PEN');
  });

  it('creates a PEN/USD pair', () => {
    expect(CurrencyPair.create('pen', 'usd').value).toBe('PEN/USD');
  });

  it('rejects a pair with the same currency on both sides', () => {
    expect(() => CurrencyPair.create('USD', 'usd')).toThrow(
      SameCurrencyPairError,
    );
  });
});
