import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRateCache } from '../../application/ports/exchange-rate-cache.port';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

interface CacheEntry {
  exchangeRate: ExchangeRate;
  expiresAt: number;
}

export class InMemoryExchangeRateCache implements ExchangeRateCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = 60_000) {}

  get(pair: CurrencyPair): ExchangeRate | null {
    const entry = this.entries.get(pair.value);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(pair.value);
      return null;
    }

    return entry.exchangeRate;
  }

  set(exchangeRate: ExchangeRate): void {
    this.entries.set(exchangeRate.pair.value, {
      exchangeRate,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
