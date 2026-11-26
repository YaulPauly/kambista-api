import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRateRepository } from '../../application/ports/exchange-rate-repository.port';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import {
  ExchangeRatePersistenceDocument,
  ExchangeRatePersistenceModel,
} from './exchange-rate.schema';

@Injectable()
export class MongooseExchangeRateRepository implements ExchangeRateRepository {
  constructor(
    @InjectModel(ExchangeRatePersistenceModel.name)
    private readonly exchangeRateModel: Model<ExchangeRatePersistenceDocument>,
  ) {}

  async findLatest(pair: CurrencyPair): Promise<ExchangeRate | null> {
    const document = await this.exchangeRateModel
      .findOne({
        baseCurrency: pair.baseCurrency.value,
        quoteCurrency: pair.quoteCurrency.value,
      })
      .sort({ fetchedAt: -1 })
      .exec();

    return document ? this.toDomain(document) : null;
  }

  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const document = await this.exchangeRateModel.create({
      _id: exchangeRate.id,
      baseCurrency: exchangeRate.pair.baseCurrency.value,
      quoteCurrency: exchangeRate.pair.quoteCurrency.value,
      purchaseRate: exchangeRate.purchaseRate,
      saleRate: exchangeRate.saleRate,
      source: exchangeRate.source,
      effectiveDate: exchangeRate.effectiveDate,
      fetchedAt: exchangeRate.fetchedAt,
    });

    return this.toDomain(document);
  }

  private toDomain(document: ExchangeRatePersistenceDocument): ExchangeRate {
    return ExchangeRate.rehydrate({
      id: document._id.toString(),
      pair: CurrencyPair.create(document.baseCurrency, document.quoteCurrency),
      purchaseRate: document.purchaseRate,
      saleRate: document.saleRate,
      source: document.source,
      effectiveDate: document.effectiveDate,
      fetchedAt: document.fetchedAt,
    });
  }
}
