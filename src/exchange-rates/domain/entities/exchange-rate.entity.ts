import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidExchangeRateError } from '../errors/exchange-rate.errors';

interface ExchangeRateProperties {
  id: string;
  pair: CurrencyPair;
  purchaseRate: number;
  saleRate: number;
  source: string;
  effectiveDate: Date;
  fetchedAt: Date;
}

export class ExchangeRate {
  private constructor(private readonly properties: ExchangeRateProperties) {}

  static create(properties: ExchangeRateProperties): ExchangeRate {
    if (
      !Number.isFinite(properties.purchaseRate) ||
      properties.purchaseRate <= 0
    ) {
      throw new InvalidExchangeRateError(
        'El tipo de cambio de compra debe ser mayor que cero.',
      );
    }

    if (!Number.isFinite(properties.saleRate) || properties.saleRate <= 0) {
      throw new InvalidExchangeRateError(
        'El tipo de cambio de venta debe ser mayor que cero.',
      );
    }

    if (!properties.source.trim()) {
      throw new InvalidExchangeRateError(
        'El origen del tipo de cambio es obligatorio.',
      );
    }

    if (Number.isNaN(properties.effectiveDate.getTime())) {
      throw new InvalidExchangeRateError(
        'La fecha efectiva del tipo de cambio no es válida.',
      );
    }

    if (Number.isNaN(properties.fetchedAt.getTime())) {
      throw new InvalidExchangeRateError(
        'La fecha de consulta del tipo de cambio no es válida.',
      );
    }

    return new ExchangeRate({
      ...properties,
      source: properties.source.trim(),
    });
  }

  static rehydrate(properties: ExchangeRateProperties): ExchangeRate {
    return new ExchangeRate(properties);
  }

  get id(): string {
    return this.properties.id;
  }

  get pair(): CurrencyPair {
    return this.properties.pair;
  }

  get purchaseRate(): number {
    return this.properties.purchaseRate;
  }

  get saleRate(): number {
    return this.properties.saleRate;
  }

  get source(): string {
    return this.properties.source;
  }

  get effectiveDate(): Date {
    return this.properties.effectiveDate;
  }

  get fetchedAt(): Date {
    return this.properties.fetchedAt;
  }
}
