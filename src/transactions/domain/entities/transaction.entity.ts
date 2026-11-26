import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { InvalidTransactionError } from '../errors/transaction.errors';

interface TransactionProperties {
  id: string;
  userId: string;
  pair: CurrencyPair;
  amount: number;
  convertedAmount: number;
  appliedExchangeRate: number;
  createdAt: Date;
}

export class Transaction {
  private constructor(private readonly properties: TransactionProperties) {}

  static create(properties: TransactionProperties): Transaction {
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

    if (!Number.isFinite(properties.amount) || properties.amount <= 0) {
      throw new InvalidTransactionError('El monto debe ser mayor que cero.');
    }

    if (
      !Number.isFinite(properties.convertedAmount) ||
      properties.convertedAmount <= 0
    ) {
      throw new InvalidTransactionError(
        'El monto cambiado debe ser mayor que cero.',
      );
    }

    if (
      !Number.isFinite(properties.appliedExchangeRate) ||
      properties.appliedExchangeRate <= 0
    ) {
      throw new InvalidTransactionError(
        'El tipo de cambio aplicado debe ser mayor que cero.',
      );
    }

    if (Number.isNaN(properties.createdAt.getTime())) {
      throw new InvalidTransactionError(
        'La fecha de la transacción no es válida.',
      );
    }

    return new Transaction(properties);
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

  get amount(): number {
    return this.properties.amount;
  }

  get convertedAmount(): number {
    return this.properties.convertedAmount;
  }

  get appliedExchangeRate(): number {
    return this.properties.appliedExchangeRate;
  }

  get createdAt(): Date {
    return this.properties.createdAt;
  }
}
