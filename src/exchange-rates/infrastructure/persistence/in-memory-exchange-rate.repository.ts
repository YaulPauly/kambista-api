import { Injectable } from '@nestjs/common';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRateRepository } from '../../application/ports/exchange-rate-repository.port';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

@Injectable()
export class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  private readonly exchangeRates: ExchangeRate[] = [];

  findLatest(pair: CurrencyPair): Promise<ExchangeRate | null> {
    const matchingRates = this.exchangeRates
      .filter((exchangeRate) => exchangeRate.pair.value === pair.value)
      .sort(
        (left, right) => right.fetchedAt.getTime() - left.fetchedAt.getTime(),
      );

    return Promise.resolve(matchingRates[0] ?? null);
  }

  save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    this.exchangeRates.push(exchangeRate);
    return Promise.resolve(exchangeRate);
  }
}
