import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidExchangeRateError } from '../errors/exchange-rate.errors';
import { ExchangeRate } from './exchange-rate.entity';

const pair = CurrencyPair.create('USD', 'PEN');
const effectiveDate = new Date('2026-11-26T05:00:00.000Z');
const fetchedAt = new Date('2026-11-26T15:00:00.000Z');

describe('ExchangeRate', () => {
  it('creates a valid exchange rate', () => {
    const exchangeRate = ExchangeRate.create({
      id: 'rate-id',
      pair,
      purchaseRate: 3.49,
      saleRate: 3.496,
      source: 'SUNAT',
      effectiveDate,
      fetchedAt,
    });

    expect(exchangeRate.pair.value).toBe('USD/PEN');
    expect(exchangeRate.purchaseRate).toBe(3.49);
    expect(exchangeRate.saleRate).toBe(3.496);
    expect(exchangeRate.source).toBe('SUNAT');
  });

  it('rejects non-positive rates', () => {
    expect(() =>
      ExchangeRate.create({
        id: 'rate-id',
        pair,
        purchaseRate: 0,
        saleRate: 3.496,
        source: 'SUNAT',
        effectiveDate,
        fetchedAt,
      }),
    ).toThrow(InvalidExchangeRateError);
  });
});
