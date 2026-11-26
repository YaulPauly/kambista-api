export interface ExchangeRateProviderResult {
  baseCurrency: string;
  quoteCurrency: string;
  purchaseRate: number;
  saleRate: number;
  source: string;
  effectiveDate: Date;
}

export interface ExchangeRateProvider {
  getLatest(): Promise<ExchangeRateProviderResult>;
}

export const EXCHANGE_RATE_PROVIDER = Symbol('EXCHANGE_RATE_PROVIDER');
