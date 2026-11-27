import Decimal from 'decimal.js';

export interface ExchangeRateProviderResult {
  baseCurrency: string;
  quoteCurrency: string;
  purchaseRate: Decimal;
  saleRate: Decimal;
  source: string;
  effectiveDate: Date;
}

export interface ExchangeRateProvider {
  getLatest(): Promise<ExchangeRateProviderResult>;
}

export const EXCHANGE_RATE_PROVIDER = Symbol('EXCHANGE_RATE_PROVIDER');
