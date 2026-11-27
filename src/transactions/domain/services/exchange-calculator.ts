import Decimal from 'decimal.js';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../../exchange-rates/domain/entities/exchange-rate.entity';
import { InvalidTransactionError } from '../errors/transaction.errors';

export interface ExchangeCalculationResult {
  convertedAmount: Decimal;
  appliedExchangeRate: Decimal;
}

export class ExchangeCalculator {
  static calculate(
    amount: Decimal.Value,
    requestedPair: CurrencyPair,
    exchangeRate: ExchangeRate,
  ): ExchangeCalculationResult {
    const amountDecimal = new Decimal(amount);
    this.validateAmount(amountDecimal);

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
        convertedAmount: this.roundMoney(
          amountDecimal.mul(exchangeRate.saleRate),
        ),
        appliedExchangeRate: exchangeRate.saleRate,
      };
    }

    return {
      convertedAmount: this.roundMoney(
        amountDecimal.div(exchangeRate.purchaseRate),
      ),
      appliedExchangeRate: exchangeRate.purchaseRate,
    };
  }

  private static validateAmount(amount: Decimal): void {
    if (!amount.isFinite() || amount.lte(0)) {
      throw new InvalidTransactionError('El monto debe ser mayor que cero.');
    }

    if (amount.gt(new Decimal('9999999.99'))) {
      throw new InvalidTransactionError(
        'El monto no puede superar 9,999,999.99.',
      );
    }

    if (amount.decimalPlaces() > 2) {
      throw new InvalidTransactionError(
        'El monto puede tener como máximo dos decimales.',
      );
    }
  }

  private static roundMoney(value: Decimal): Decimal {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }
}
