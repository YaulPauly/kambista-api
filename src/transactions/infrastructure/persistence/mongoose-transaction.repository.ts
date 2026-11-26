import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import {
  TransactionHistoryCriteria,
  TransactionRepository,
} from '../../application/ports/transaction-repository.port';
import { Transaction } from '../../domain/entities/transaction.entity';
import {
  TransactionPersistenceDocument,
  TransactionPersistenceModel,
} from './transaction.schema';

@Injectable()
export class MongooseTransactionRepository implements TransactionRepository {
  constructor(
    @InjectModel(TransactionPersistenceModel.name)
    private readonly transactionModel: Model<TransactionPersistenceDocument>,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const document = await this.transactionModel.create({
      _id: transaction.id,
      userId: transaction.userId,
      sourceCurrency: transaction.pair.baseCurrency.value,
      targetCurrency: transaction.pair.quoteCurrency.value,
      amount: transaction.amount,
      convertedAmount: transaction.convertedAmount,
      appliedExchangeRate: transaction.appliedExchangeRate,
      createdAt: transaction.createdAt,
    });

    return this.toDomain(document);
  }

  async findHistory(
    criteria: TransactionHistoryCriteria,
  ): Promise<Transaction[]> {
    const documents = await this.transactionModel
      .find({
        userId: criteria.userId,
        createdAt: {
          $gte: criteria.startDate,
          $lte: criteria.endDate,
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    return documents.map((document) => this.toDomain(document));
  }

  private toDomain(document: TransactionPersistenceDocument): Transaction {
    return Transaction.rehydrate({
      id: document._id.toString(),
      userId: document.userId,
      pair: CurrencyPair.create(
        document.sourceCurrency,
        document.targetCurrency,
      ),
      amount: document.amount,
      convertedAmount: document.convertedAmount,
      appliedExchangeRate: document.appliedExchangeRate,
      createdAt: document.createdAt,
    });
  }
}
