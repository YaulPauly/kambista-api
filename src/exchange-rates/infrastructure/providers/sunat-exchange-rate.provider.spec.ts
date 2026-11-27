import { ConfigService } from '@nestjs/config';
import { ExchangeRateProviderError } from '../../domain/errors/exchange-rate.errors';
import { SunatExchangeRateProvider } from './sunat-exchange-rate.provider';

describe('SunatExchangeRateProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the provider response to the application contract', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          compra: 3.49,
          venta: 3.496,
          origen: 'SUNAT',
          moneda: 'USD',
          fecha: '2026-11-26',
        }),
        { status: 200 },
      ),
    );
    const configService = new ConfigService({
      EXCHANGE_RATE_PROVIDER_URL:
        'https://api.apis.net.pe/v1/tipo-cambio-sunat',
      EXCHANGE_RATE_PROVIDER_TOKEN: '',
      EXCHANGE_RATE_REQUEST_TIMEOUT_MS: 5_000,
    });
    const provider = new SunatExchangeRateProvider(configService);

    const result = await provider.getLatest();

    expect(result).toMatchObject({
      baseCurrency: 'USD',
      quoteCurrency: 'PEN',
      purchaseRate: new Decimal('3.49'),
      saleRate: new Decimal('3.496'),
      source: 'SUNAT',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.apis.net.pe/v1/tipo-cambio-sunat',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('rejects an invalid provider response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ invalid: true }), { status: 200 }),
      );
    const provider = new SunatExchangeRateProvider(
      new ConfigService({
        EXCHANGE_RATE_PROVIDER_URL:
          'https://api.apis.net.pe/v1/tipo-cambio-sunat',
        EXCHANGE_RATE_REQUEST_TIMEOUT_MS: 5_000,
      }),
    );

    await expect(provider.getLatest()).rejects.toBeInstanceOf(
      ExchangeRateProviderError,
    );
  });
});
import Decimal from 'decimal.js';
