import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { GetLatestExchangeRateUseCase } from '../../../exchange-rates/application/use-cases/get-latest-exchange-rate.use-case';
import { ExchangeCalculator } from '../../domain/services/exchange-calculator';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TRANSACTION_REPOSITORY } from '../ports/transaction-repository.port';
import type { TransactionRepository } from '../ports/transaction-repository.port';

export interface CreateTransactionCommand {
  userId: string;
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    const requestedPair = CurrencyPair.create(
      command.sourceCurrency,
      command.targetCurrency,
    );
    const exchangeRate = await this.getLatestExchangeRateUseCase.execute({
      baseCurrency: requestedPair.baseCurrency.value,
      quoteCurrency: requestedPair.quoteCurrency.value,
    });
    const calculation = ExchangeCalculator.calculate(
      command.amount,
      requestedPair,
      exchangeRate,
    );
    const transaction = Transaction.create({
      id: randomUUID(),
      userId: command.userId,
      pair: requestedPair,
      amount: command.amount,
      convertedAmount: calculation.convertedAmount,
      appliedExchangeRate: calculation.appliedExchangeRate,
      createdAt: new Date(),
    });

    return this.transactionRepository.save(transaction);
  }
}
