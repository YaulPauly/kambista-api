import { Injectable } from '@nestjs/common';
import {
  TransactionHistoryCriteria,
  TransactionHistoryPage,
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

  findHistory(
    criteria: TransactionHistoryCriteria,
  ): Promise<TransactionHistoryPage> {
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

    const startIndex = (criteria.page - 1) * criteria.pageSize;

    return Promise.resolve({
      transactions: matchingTransactions.slice(
        startIndex,
        startIndex + criteria.pageSize,
      ),
      total: matchingTransactions.length,
    });
  }
}
