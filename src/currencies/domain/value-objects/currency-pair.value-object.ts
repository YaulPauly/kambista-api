import { SameCurrencyPairError } from '../errors/currency.errors';
import { CurrencyCode } from './currency-code.value-object';

export class CurrencyPair {
  private constructor(
    public readonly baseCurrency: CurrencyCode,
    public readonly quoteCurrency: CurrencyCode,
  ) {}

  static create(
    baseCurrency: CurrencyCode | string,
    quoteCurrency: CurrencyCode | string,
  ): CurrencyPair {
    const base = CurrencyPair.toCurrencyCode(baseCurrency);
    const quote = CurrencyPair.toCurrencyCode(quoteCurrency);

    if (base.value === quote.value) {
      throw new SameCurrencyPairError(base.value);
    }

    return new CurrencyPair(base, quote);
  }

  get value(): string {
    return `${this.baseCurrency.value}/${this.quoteCurrency.value}`;
  }

  private static toCurrencyCode(value: CurrencyCode | string): CurrencyCode {
    return value instanceof CurrencyCode ? value : CurrencyCode.create(value);
  }
}
