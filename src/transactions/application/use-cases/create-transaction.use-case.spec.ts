import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../../exchange-rates/domain/entities/exchange-rate.entity';
import { GetLatestExchangeRateUseCase } from '../../../exchange-rates/application/use-cases/get-latest-exchange-rate.use-case';
import { Transaction } from '../../domain/entities/transaction.entity';
import type { TransactionRepository } from '../ports/transaction-repository.port';
import { CreateTransactionUseCase } from './create-transaction.use-case';

class FakeTransactionRepository implements TransactionRepository {
  savedTransaction?: Transaction;

  save = (transaction: Transaction): Promise<Transaction> => {
    this.savedTransaction = transaction;
    return Promise.resolve(transaction);
  };

  findHistory = (): Promise<Transaction[]> => Promise.resolve([]);
}

function createExchangeRate(): ExchangeRate {
  return ExchangeRate.create({
    id: 'rate-id',
    pair: CurrencyPair.create('USD', 'PEN'),
    purchaseRate: 3.49,
    saleRate: 3.739,
    source: 'SUNAT',
    effectiveDate: new Date('2026-11-26T05:00:00.000Z'),
    fetchedAt: new Date('2026-11-26T15:00:00.000Z'),
  });
}

describe('CreateTransactionUseCase', () => {
  it('calculates and saves a USD to PEN transaction', async () => {
    const repository = new FakeTransactionRepository();
    const execute = jest.fn().mockResolvedValue(createExchangeRate());
    const exchangeRateUseCase = {
      execute,
    } as unknown as GetLatestExchangeRateUseCase;
    const useCase = new CreateTransactionUseCase(
      repository,
      exchangeRateUseCase,
    );

    const result = await useCase.execute({
      userId: 'user-id',
      sourceCurrency: 'USD',
      targetCurrency: 'PEN',
      amount: 100,
    });

    expect(result.convertedAmount).toBe(373.9);
    expect(result.appliedExchangeRate).toBe(3.739);
    expect(repository.savedTransaction).toBe(result);
    expect(execute).toHaveBeenCalledWith({
      baseCurrency: 'USD',
      quoteCurrency: 'PEN',
    });
  });

  it('calculates a PEN to USD transaction using the inverse pair', async () => {
    const repository = new FakeTransactionRepository();
    const exchangeRateUseCase = {
      execute: jest.fn().mockResolvedValue(createExchangeRate()),
    } as unknown as GetLatestExchangeRateUseCase;
    const useCase = new CreateTransactionUseCase(
      repository,
      exchangeRateUseCase,
    );

    const result = await useCase.execute({
      userId: 'user-id',
      sourceCurrency: 'PEN',
      targetCurrency: 'USD',
      amount: 100,
    });

    expect(result.pair.value).toBe('PEN/USD');
    expect(result.convertedAmount).toBe(28.65);
    expect(result.appliedExchangeRate).toBe(3.49);
  });
});
