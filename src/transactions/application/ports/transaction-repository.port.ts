import { Transaction } from '../../domain/entities/transaction.entity';

export interface TransactionHistoryCriteria {
  userId: string;
  startDate: Date;
  endDate: Date;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findHistory(criteria: TransactionHistoryCriteria): Promise<Transaction[]>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
