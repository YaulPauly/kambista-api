import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Decimal from 'decimal.js';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import {
  TransactionHistoryCriteria,
  TransactionHistoryPage,
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
      amount: Types.Decimal128.fromString(transaction.amount.toString()),
      convertedAmount: Types.Decimal128.fromString(
        transaction.convertedAmount.toString(),
      ),
      appliedExchangeRate: Types.Decimal128.fromString(
        transaction.appliedExchangeRate.toString(),
      ),
      createdAt: transaction.createdAt,
    });

    return this.toDomain(document);
  }

  async findHistory(
    criteria: TransactionHistoryCriteria,
  ): Promise<TransactionHistoryPage> {
    const filter = {
      userId: criteria.userId,
      createdAt: {
        $gte: criteria.startDate,
        $lte: criteria.endDate,
      },
    };
    const [documents, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((criteria.page - 1) * criteria.pageSize)
        .limit(criteria.pageSize)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return {
      transactions: documents.map((document) => this.toDomain(document)),
      total,
    };
  }

  private toDomain(document: TransactionPersistenceDocument): Transaction {
    return Transaction.rehydrate({
      id: document._id.toString(),
      userId: document.userId,
      pair: CurrencyPair.create(
        document.sourceCurrency,
        document.targetCurrency,
      ),
      amount: new Decimal(document.amount.toString()),
      convertedAmount: new Decimal(document.convertedAmount.toString()),
      appliedExchangeRate: new Decimal(document.appliedExchangeRate.toString()),
      createdAt: document.createdAt,
    });
  }
}
