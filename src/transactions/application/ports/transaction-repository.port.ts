import { Transaction } from '../../domain/entities/transaction.entity';

export interface TransactionHistoryCriteria {
  userId: string;
  startDate: Date;
  endDate: Date;
  page: number;
  pageSize: number;
}

export interface TransactionHistoryPage {
  transactions: Transaction[];
  total: number;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findHistory(
    criteria: TransactionHistoryCriteria,
  ): Promise<TransactionHistoryPage>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
