import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { EXCHANGE_RATE_CACHE } from '../ports/exchange-rate-cache.port';
import type { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import { EXCHANGE_RATE_PROVIDER } from '../ports/exchange-rate-provider.port';
import type { ExchangeRateProvider } from '../ports/exchange-rate-provider.port';
import { EXCHANGE_RATE_REPOSITORY } from '../ports/exchange-rate-repository.port';
import type { ExchangeRateRepository } from '../ports/exchange-rate-repository.port';

@Injectable()
export class RefreshExchangeRateUseCase {
  constructor(
    @Inject(EXCHANGE_RATE_PROVIDER)
    private readonly exchangeRateProvider: ExchangeRateProvider,
    @Inject(EXCHANGE_RATE_REPOSITORY)
    private readonly exchangeRateRepository: ExchangeRateRepository,
    @Inject(EXCHANGE_RATE_CACHE)
    private readonly exchangeRateCache: ExchangeRateCache,
  ) {}

  async execute(): Promise<ExchangeRate> {
    const providerResult = await this.exchangeRateProvider.getLatest();

    const pair = CurrencyPair.create(
      providerResult.baseCurrency,
      providerResult.quoteCurrency,
    );

    const exchangeRate = ExchangeRate.create({
      id: randomUUID(),
      pair,
      purchaseRate: providerResult.purchaseRate,
      saleRate: providerResult.saleRate,
      source: providerResult.source,
      effectiveDate: providerResult.effectiveDate,
      fetchedAt: new Date(),
    });

    const savedExchangeRate =
      await this.exchangeRateRepository.save(exchangeRate);

    this.exchangeRateCache.set(savedExchangeRate);
    return savedExchangeRate;
  }
}
