import { Inject, Injectable } from '@nestjs/common';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRateNotAvailableError } from '../../domain/errors/exchange-rate.errors';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { EXCHANGE_RATE_CACHE } from '../ports/exchange-rate-cache.port';
import type { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import { EXCHANGE_RATE_REPOSITORY } from '../ports/exchange-rate-repository.port';
import type { ExchangeRateRepository } from '../ports/exchange-rate-repository.port';

export interface GetLatestExchangeRateCommand {
  baseCurrency: string;
  quoteCurrency: string;
}

@Injectable()
export class GetLatestExchangeRateUseCase {
  constructor(
    @Inject(EXCHANGE_RATE_REPOSITORY)
    private readonly exchangeRateRepository: ExchangeRateRepository,
    @Inject(EXCHANGE_RATE_CACHE)
    private readonly exchangeRateCache: ExchangeRateCache,
  ) {}

  async execute(command: GetLatestExchangeRateCommand): Promise<ExchangeRate> {
    const pair = CurrencyPair.create(
      command.baseCurrency,
      command.quoteCurrency,
    );

    const cachedExchangeRate = this.exchangeRateCache.get(pair);

    if (cachedExchangeRate) {
      return cachedExchangeRate;
    }

    const exchangeRate = await this.exchangeRateRepository.findLatest(pair);

    if (!exchangeRate) {
      throw new ExchangeRateNotAvailableError();
    }

    this.exchangeRateCache.set(exchangeRate);
    return exchangeRate;
  }
}
