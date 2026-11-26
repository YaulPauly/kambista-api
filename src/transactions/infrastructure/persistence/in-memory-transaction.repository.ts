import { Injectable } from '@nestjs/common';
import {
  TransactionHistoryCriteria,
  TransactionRepository,
} from '../../application/ports/transaction-repository.port';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly transactions: Transaction[] = [];

  save(transaction: Transaction): Promise<Transaction> {
    this.transactions.push(transaction);
    return Promise.resolve(transaction);
  }

  findHistory(criteria: TransactionHistoryCriteria): Promise<Transaction[]> {
    const matchingTransactions = this.transactions
      .filter(
        (transaction) =>
          transaction.userId === criteria.userId &&
          transaction.createdAt >= criteria.startDate &&
          transaction.createdAt <= criteria.endDate,
      )
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );

    return Promise.resolve(matchingTransactions);
  }
}
