import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EXCHANGE_RATE_CACHE,
  ExchangeRateCache,
} from './application/ports/exchange-rate-cache.port';
import { EXCHANGE_RATE_PROVIDER } from './application/ports/exchange-rate-provider.port';
import { EXCHANGE_RATE_REPOSITORY } from './application/ports/exchange-rate-repository.port';
import { GetLatestExchangeRateUseCase } from './application/use-cases/get-latest-exchange-rate.use-case';
import { RefreshExchangeRateUseCase } from './application/use-cases/refresh-exchange-rate.use-case';
import { ExchangeRateRefreshScheduler } from './infrastructure/scheduling/exchange-rate-refresh.scheduler';
import { InMemoryExchangeRateRepository } from './infrastructure/persistence/in-memory-exchange-rate.repository';
import { MongooseExchangeRateRepository } from './infrastructure/persistence/mongoose-exchange-rate.repository';
import {
  ExchangeRatePersistenceModel,
  ExchangeRatePersistenceSchema,
} from './infrastructure/persistence/exchange-rate.schema';
import { InMemoryExchangeRateCache } from './infrastructure/cache/in-memory-exchange-rate.cache';
import { SunatExchangeRateProvider } from './infrastructure/providers/sunat-exchange-rate.provider';

@Module({})
export class ExchangeRatesModule {
  static register(): DynamicModule {
    const useMongoPersistence =
      process.env.NODE_ENV !== 'test' && Boolean(process.env.MONGODB_URI);
    const imports: DynamicModule['imports'] = [ConfigModule];
    const persistenceProviders: Provider[] = useMongoPersistence
      ? [
          MongooseExchangeRateRepository,
          {
            provide: EXCHANGE_RATE_REPOSITORY,
            useExisting: MongooseExchangeRateRepository,
          },
        ]
      : [
          InMemoryExchangeRateRepository,
          {
            provide: EXCHANGE_RATE_REPOSITORY,
            useExisting: InMemoryExchangeRateRepository,
          },
        ];

    if (useMongoPersistence) {
      imports.push(
        MongooseModule.forRoot(process.env.MONGODB_URI as string),
        MongooseModule.forFeature([
          {
            name: ExchangeRatePersistenceModel.name,
            schema: ExchangeRatePersistenceSchema,
          },
        ]),
      );
    }

    const providers: Provider[] = [
      ...persistenceProviders,
      SunatExchangeRateProvider,
      {
        provide: EXCHANGE_RATE_PROVIDER,
        useExisting: SunatExchangeRateProvider,
      },
      {
        provide: EXCHANGE_RATE_CACHE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService): ExchangeRateCache =>
          new InMemoryExchangeRateCache(
            configService.get<number>('EXCHANGE_RATE_CACHE_TTL_MS', 60_000),
          ),
      },
      RefreshExchangeRateUseCase,
      GetLatestExchangeRateUseCase,
    ];

    if (process.env.NODE_ENV !== 'test') {
      providers.push(ExchangeRateRefreshScheduler);
    }

    return {
      module: ExchangeRatesModule,
      imports,
      providers,
      exports: [GetLatestExchangeRateUseCase],
    };
  }
}
