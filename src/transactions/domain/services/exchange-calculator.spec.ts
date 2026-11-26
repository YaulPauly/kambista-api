import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../../exchange-rates/domain/entities/exchange-rate.entity';
import { InvalidTransactionError } from '../errors/transaction.errors';
import { ExchangeCalculator } from './exchange-calculator';

const exchangeRate = ExchangeRate.create({
  id: 'rate-id',
  pair: CurrencyPair.create('USD', 'PEN'),
  purchaseRate: 3.49,
  saleRate: 3.739,
  source: 'SUNAT',
  effectiveDate: new Date('2026-11-26T05:00:00.000Z'),
  fetchedAt: new Date('2026-11-26T15:00:00.000Z'),
});

describe('ExchangeCalculator', () => {
  it('uses the sale rate for USD to PEN', () => {
    const result = ExchangeCalculator.calculate(
      100,
      CurrencyPair.create('USD', 'PEN'),
      exchangeRate,
    );

    expect(result).toEqual({
      convertedAmount: 373.9,
      appliedExchangeRate: 3.739,
    });
  });

  it('uses the purchase rate for PEN to USD', () => {
    const result = ExchangeCalculator.calculate(
      100,
      CurrencyPair.create('PEN', 'USD'),
      exchangeRate,
    );

    expect(result).toEqual({
      convertedAmount: 28.65,
      appliedExchangeRate: 3.49,
    });
  });

  it('rejects amounts with more than two decimal places', () => {
    expect(() =>
      ExchangeCalculator.calculate(
        100.123,
        CurrencyPair.create('USD', 'PEN'),
        exchangeRate,
      ),
    ).toThrow(InvalidTransactionError);
  });
});
