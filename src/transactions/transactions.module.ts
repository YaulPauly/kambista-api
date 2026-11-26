import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { IdentityModule } from '../identity/identity.module';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionHistoryUseCase } from './application/use-cases/get-transaction-history.use-case';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { InMemoryTransactionRepository } from './infrastructure/persistence/in-memory-transaction.repository';
import { MongooseTransactionRepository } from './infrastructure/persistence/mongoose-transaction.repository';
import {
  TransactionPersistenceModel,
  TransactionPersistenceSchema,
} from './infrastructure/persistence/transaction.schema';
import { TRANSACTION_REPOSITORY } from './application/ports/transaction-repository.port';

@Module({})
export class TransactionsModule {
  static register(): DynamicModule {
    const useMongoPersistence =
      process.env.NODE_ENV !== 'test' && Boolean(process.env.MONGODB_URI);
    const imports: DynamicModule['imports'] = [
      ConfigModule,
      IdentityModule.register(),
      ExchangeRatesModule.register(),
    ];
    const persistenceProviders: Provider[] = useMongoPersistence
      ? [
          MongooseTransactionRepository,
          {
            provide: TRANSACTION_REPOSITORY,
            useExisting: MongooseTransactionRepository,
          },
        ]
      : [
          InMemoryTransactionRepository,
          {
            provide: TRANSACTION_REPOSITORY,
            useExisting: InMemoryTransactionRepository,
          },
        ];

    if (useMongoPersistence) {
      imports.push(
        MongooseModule.forFeature([
          {
            name: TransactionPersistenceModel.name,
            schema: TransactionPersistenceSchema,
          },
        ]),
      );
    }

    return {
      module: TransactionsModule,
      imports,
      controllers: [TransactionsController],
      providers: [
        ...persistenceProviders,
        CreateTransactionUseCase,
        GetTransactionHistoryUseCase,
      ],
    };
  }
}
