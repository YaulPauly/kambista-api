import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRateNotAvailableError } from '../../domain/errors/exchange-rate.errors';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import type { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import type { ExchangeRateRepository } from '../ports/exchange-rate-repository.port';
import { GetLatestExchangeRateUseCase } from './get-latest-exchange-rate.use-case';

class FakeRepository implements ExchangeRateRepository {
  latestRate: ExchangeRate | null = null;
  findLatestCalls = 0;

  findLatest = (): Promise<ExchangeRate | null> => {
    this.findLatestCalls += 1;
    return Promise.resolve(this.latestRate);
  };

  save = (exchangeRate: ExchangeRate): Promise<ExchangeRate> =>
    Promise.resolve(exchangeRate);
}

class FakeCache implements ExchangeRateCache {
  cachedRate: ExchangeRate | null = null;

  get = (): ExchangeRate | null => this.cachedRate;

  set = (exchangeRate: ExchangeRate): void => {
    this.cachedRate = exchangeRate;
  };
}

function createExchangeRate(): ExchangeRate {
  return ExchangeRate.create({
    id: 'rate-id',
    pair: CurrencyPair.create('USD', 'PEN'),
    purchaseRate: 3.49,
    saleRate: 3.496,
    source: 'SUNAT',
    effectiveDate: new Date('2026-11-26T05:00:00.000Z'),
    fetchedAt: new Date('2026-11-26T15:00:00.000Z'),
  });
}

describe('GetLatestExchangeRateUseCase', () => {
  it('returns the cached rate without querying the repository', async () => {
    const repository = new FakeRepository();
    const cache = new FakeCache();
    const cachedRate = createExchangeRate();
    cache.cachedRate = cachedRate;
    const useCase = new GetLatestExchangeRateUseCase(repository, cache);

    const result = await useCase.execute({
      baseCurrency: 'USD',
      quoteCurrency: 'PEN',
    });

    expect(result).toBe(cachedRate);
    expect(repository.findLatestCalls).toBe(0);
  });

  it('loads the repository when the cache misses and populates the cache', async () => {
    const repository = new FakeRepository();
    const cache = new FakeCache();
    const storedRate = createExchangeRate();
    repository.latestRate = storedRate;
    const useCase = new GetLatestExchangeRateUseCase(repository, cache);

    const result = await useCase.execute({
      baseCurrency: 'USD',
      quoteCurrency: 'PEN',
    });

    expect(result).toBe(storedRate);
    expect(repository.findLatestCalls).toBe(1);
    expect(cache.cachedRate).toBe(storedRate);
  });

  it('throws when no exchange rate is available', async () => {
    const useCase = new GetLatestExchangeRateUseCase(
      new FakeRepository(),
      new FakeCache(),
    );

    await expect(
      useCase.execute({
        baseCurrency: 'USD',
        quoteCurrency: 'PEN',
      }),
    ).rejects.toBeInstanceOf(ExchangeRateNotAvailableError);
  });
});
