import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../../exchange-rates/domain/entities/exchange-rate.entity';
import { InvalidTransactionError } from '../errors/transaction.errors';

export interface ExchangeCalculationResult {
  convertedAmount: number;
  appliedExchangeRate: number;
}

export class ExchangeCalculator {
  static calculate(
    amount: number,
    requestedPair: CurrencyPair,
    exchangeRate: ExchangeRate,
  ): ExchangeCalculationResult {
    this.validateAmount(amount);

    const isDirectPair = requestedPair.value === exchangeRate.pair.value;
    const isInversePair =
      requestedPair.baseCurrency.value ===
        exchangeRate.pair.quoteCurrency.value &&
      requestedPair.quoteCurrency.value ===
        exchangeRate.pair.baseCurrency.value;

    if (!isDirectPair && !isInversePair) {
      throw new InvalidTransactionError(
        'El tipo de cambio no corresponde al par solicitado.',
      );
    }

    if (isDirectPair) {
      return {
        convertedAmount: this.roundMoney(amount * exchangeRate.saleRate),
        appliedExchangeRate: exchangeRate.saleRate,
      };
    }

    return {
      convertedAmount: this.roundMoney(amount / exchangeRate.purchaseRate),
      appliedExchangeRate: exchangeRate.purchaseRate,
    };
  }

  private static validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new InvalidTransactionError('El monto debe ser mayor que cero.');
    }

    if (amount > 9_999_999.99) {
      throw new InvalidTransactionError(
        'El monto no puede superar 9,999,999.99.',
      );
    }

    if (Number(amount.toFixed(2)) !== amount) {
      throw new InvalidTransactionError(
        'El monto puede tener como máximo dos decimales.',
      );
    }
  }

  private static roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
