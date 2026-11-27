import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidTransactionError } from '../errors/transaction.errors';
import { Transaction } from './transaction.entity';

describe('Transaction', () => {
  it('creates a valid transaction', () => {
    const transaction = Transaction.create({
      id: 'transaction-id',
      userId: 'user-id',
      pair: CurrencyPair.create('USD', 'PEN'),
      amount: 100,
      convertedAmount: 373.9,
      appliedExchangeRate: 3.739,
      createdAt: new Date('2026-11-26T15:00:00.000Z'),
    });

    expect(transaction.pair.value).toBe('USD/PEN');
    expect(transaction.amount.toNumber()).toBe(100);
    expect(transaction.convertedAmount.toNumber()).toBe(373.9);
  });

  it('rejects a non-positive amount', () => {
    expect(() =>
      Transaction.create({
        id: 'transaction-id',
        userId: 'user-id',
        pair: CurrencyPair.create('USD', 'PEN'),
        amount: 0,
        convertedAmount: 0,
        appliedExchangeRate: 3.739,
        createdAt: new Date(),
      }),
    ).toThrow(InvalidTransactionError);
  });
});
