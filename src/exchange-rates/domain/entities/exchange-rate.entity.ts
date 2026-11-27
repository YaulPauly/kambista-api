import Decimal from 'decimal.js';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidExchangeRateError } from '../errors/exchange-rate.errors';

interface ExchangeRateProperties {
  id: string;
  pair: CurrencyPair;
  purchaseRate: Decimal;
  saleRate: Decimal;
  source: string;
  effectiveDate: Date;
  fetchedAt: Date;
}

interface ExchangeRateCreationProperties extends Omit<
  ExchangeRateProperties,
  'purchaseRate' | 'saleRate'
> {
  purchaseRate: Decimal.Value;
  saleRate: Decimal.Value;
}

export class ExchangeRate {
  private constructor(private readonly properties: ExchangeRateProperties) {}

  static create(properties: ExchangeRateCreationProperties): ExchangeRate {
    const purchaseRate = new Decimal(properties.purchaseRate);
    const saleRate = new Decimal(properties.saleRate);

    if (!purchaseRate.isFinite() || purchaseRate.lte(0)) {
      throw new InvalidExchangeRateError(
        'El tipo de cambio de compra debe ser mayor que cero.',
      );
    }

    if (!saleRate.isFinite() || saleRate.lte(0)) {
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
      purchaseRate,
      saleRate,
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

  get purchaseRate(): Decimal {
    return this.properties.purchaseRate;
  }

  get saleRate(): Decimal {
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
