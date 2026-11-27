import Decimal from 'decimal.js';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidTransactionError } from '../errors/transaction.errors';

interface TransactionProperties {
  id: string;
  userId: string;
  pair: CurrencyPair;
  amount: Decimal;
  convertedAmount: Decimal;
  appliedExchangeRate: Decimal;
  createdAt: Date;
}

interface TransactionCreationProperties extends Omit<
  TransactionProperties,
  'amount' | 'convertedAmount' | 'appliedExchangeRate'
> {
  amount: Decimal.Value;
  convertedAmount: Decimal.Value;
  appliedExchangeRate: Decimal.Value;
}

export class Transaction {
  private constructor(private readonly properties: TransactionProperties) {}

  static create(properties: TransactionCreationProperties): Transaction {
    const amount = new Decimal(properties.amount);
    const convertedAmount = new Decimal(properties.convertedAmount);
    const appliedExchangeRate = new Decimal(properties.appliedExchangeRate);

    if (!properties.id.trim()) {
      throw new InvalidTransactionError(
        'El identificador de la transacción es obligatorio.',
      );
    }

    if (!properties.userId.trim()) {
      throw new InvalidTransactionError(
        'El identificador del usuario es obligatorio.',
      );
    }

    if (!amount.isFinite() || amount.lte(0)) {
      throw new InvalidTransactionError('El monto debe ser mayor que cero.');
    }

    if (!convertedAmount.isFinite() || convertedAmount.lte(0)) {
      throw new InvalidTransactionError(
        'El monto cambiado debe ser mayor que cero.',
      );
    }

    if (!appliedExchangeRate.isFinite() || appliedExchangeRate.lte(0)) {
      throw new InvalidTransactionError(
        'El tipo de cambio aplicado debe ser mayor que cero.',
      );
    }

    if (Number.isNaN(properties.createdAt.getTime())) {
      throw new InvalidTransactionError(
        'La fecha de la transacción no es válida.',
      );
    }

    return new Transaction({
      ...properties,
      amount,
      convertedAmount,
      appliedExchangeRate,
    });
  }

  static rehydrate(properties: TransactionProperties): Transaction {
    return new Transaction(properties);
  }

  get id(): string {
    return this.properties.id;
  }

  get userId(): string {
    return this.properties.userId;
  }

  get pair(): CurrencyPair {
    return this.properties.pair;
  }

  get amount(): Decimal {
    return this.properties.amount;
  }

  get convertedAmount(): Decimal {
    return this.properties.convertedAmount;
  }

  get appliedExchangeRate(): Decimal {
    return this.properties.appliedExchangeRate;
  }

  get createdAt(): Date {
    return this.properties.createdAt;
  }
}
