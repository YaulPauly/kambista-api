import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

export interface ExchangeRateCache {
  get(pair: CurrencyPair): ExchangeRate | null;
  set(exchangeRate: ExchangeRate): void;
}

export const EXCHANGE_RATE_CACHE = Symbol('EXCHANGE_RATE_CACHE');
