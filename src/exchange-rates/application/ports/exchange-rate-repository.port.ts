import { CurrencyPair } from '../../../currencies/domain/value-objects/currency-pair.value-object'
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity'

export interface ExchangeRateRepository {
  findLatest(pair: CurrencyPair): Promise<ExchangeRate | null>
  save(exchangeRate: ExchangeRate): Promise<ExchangeRate>
}

export const EXCHANGE_RATE_REPOSITORY = Symbol('EXCHANGE_RATE_REPOSITORY')
