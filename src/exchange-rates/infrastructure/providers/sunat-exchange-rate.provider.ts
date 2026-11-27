import Decimal from 'decimal.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExchangeRateProvider,
  ExchangeRateProviderResult,
} from '../../application/ports/exchange-rate-provider.port';
import { ExchangeRateProviderError } from '../../domain/errors/exchange-rate.errors';

interface SunatResponse {
  compra: number;
  venta: number;
  origen: string;
  moneda: string;
  fecha: string;
}

function isSunatResponse(value: unknown): value is SunatResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    typeof response.compra === 'number' &&
    typeof response.venta === 'number' &&
    typeof response.origen === 'string' &&
    typeof response.moneda === 'string' &&
    typeof response.fecha === 'string'
  );
}

@Injectable()
export class SunatExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly configService: ConfigService) {}

  async getLatest(): Promise<ExchangeRateProviderResult> {
    const url = this.configService.getOrThrow<string>(
      'EXCHANGE_RATE_PROVIDER_URL',
    );
    const token = this.configService.get<string>(
      'EXCHANGE_RATE_PROVIDER_TOKEN',
      '',
    );
    const timeoutMs = this.configService.get<number>(
      'EXCHANGE_RATE_REQUEST_TIMEOUT_MS',
      5_000,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExchangeRateProviderError();
      }

      const payload: unknown = await response.json();

      if (!isSunatResponse(payload)) {
        throw new ExchangeRateProviderError();
      }

      const effectiveDate = new Date(`${payload.fecha}T00:00:00.000-05:00`);

      if (Number.isNaN(effectiveDate.getTime())) {
        throw new ExchangeRateProviderError();
      }

      return {
        baseCurrency: payload.moneda,
        quoteCurrency: 'PEN',
        purchaseRate: new Decimal(payload.compra),
        saleRate: new Decimal(payload.venta),
        source: payload.origen,
        effectiveDate,
      };
    } catch (error: unknown) {
      if (error instanceof ExchangeRateProviderError) {
        throw error;
      }

      throw new ExchangeRateProviderError();
    } finally {
      clearTimeout(timeout);
    }
  }
}
