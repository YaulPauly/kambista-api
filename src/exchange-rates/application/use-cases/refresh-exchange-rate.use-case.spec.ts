import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import type { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import type {
  ExchangeRateProvider,
  ExchangeRateProviderResult,
} from '../ports/exchange-rate-provider.port';
import type { ExchangeRateRepository } from '../ports/exchange-rate-repository.port';
import { RefreshExchangeRateUseCase } from './refresh-exchange-rate.use-case';

class FakeProvider implements ExchangeRateProvider {
  readonly result: ExchangeRateProviderResult = {
    baseCurrency: 'USD',
    quoteCurrency: 'PEN',
    purchaseRate: 3.49,
    saleRate: 3.496,
    source: 'SUNAT',
    effectiveDate: new Date('2026-11-26T05:00:00.000Z'),
  };

  getLatest = (): Promise<ExchangeRateProviderResult> =>
    Promise.resolve(this.result);
}

class FakeRepository implements ExchangeRateRepository {
  readonly savedRates: ExchangeRate[] = [];

  findLatest = (): Promise<ExchangeRate | null> => Promise.resolve(null);

  save = (exchangeRate: ExchangeRate): Promise<ExchangeRate> => {
    this.savedRates.push(exchangeRate);
    return Promise.resolve(exchangeRate);
  };
}

class FakeCache implements ExchangeRateCache {
  readonly cachedRates: ExchangeRate[] = [];

  get = (): ExchangeRate | null => null;

  set = (exchangeRate: ExchangeRate): void => {
    this.cachedRates.push(exchangeRate);
  };
}

describe('RefreshExchangeRateUseCase', () => {
  it('gets, persists and caches the provider rate', async () => {
    const provider = new FakeProvider();
    const repository = new FakeRepository();
    const cache = new FakeCache();
    const useCase = new RefreshExchangeRateUseCase(provider, repository, cache);

    const result = await useCase.execute();

    expect(result.pair.value).toBe('USD/PEN');
    expect(repository.savedRates).toHaveLength(1);
    expect(cache.cachedRates).toEqual([result]);
  });

  it('uses the provider pair instead of hardcoding it in the use case', async () => {
    const provider = new FakeProvider();
    const repository = new FakeRepository();
    const cache = new FakeCache();
    const useCase = new RefreshExchangeRateUseCase(provider, repository, cache);

    await useCase.execute();

    expect(repository.savedRates[0]?.pair).toEqual(
      CurrencyPair.create('USD', 'PEN'),
    );
  });
});
