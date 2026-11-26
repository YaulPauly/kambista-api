import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { InMemoryExchangeRateCache } from './in-memory-exchange-rate.cache';

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

describe('InMemoryExchangeRateCache', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a cached rate before the TTL expires', () => {
    const cache = new InMemoryExchangeRateCache(1_000);
    const rate = createExchangeRate();
    cache.set(rate);

    expect(cache.get(rate.pair)).toBe(rate);
  });

  it('returns null after the TTL expires', () => {
    jest.useFakeTimers();
    const cache = new InMemoryExchangeRateCache(1_000);
    const rate = createExchangeRate();
    cache.set(rate);

    jest.advanceTimersByTime(1_001);

    expect(cache.get(rate.pair)).toBeNull();
  });
});
