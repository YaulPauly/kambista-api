import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshExchangeRateUseCase } from '../../application/use-cases/refresh-exchange-rate.use-case';

@Injectable()
export class ExchangeRateRefreshScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private refreshInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly refreshExchangeRateUseCase: RefreshExchangeRateUseCase,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    void this.refreshSafely();

    const intervalMs = this.configService.get<number>(
      'EXCHANGE_RATE_REFRESH_INTERVAL_MS',
      30_000,
    );
    this.refreshInterval = setInterval(() => {
      void this.refreshSafely();
    }, intervalMs);
    this.refreshInterval.unref?.();
  }

  onModuleDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async refreshSafely(): Promise<void> {
    try {
      await this.refreshExchangeRateUseCase.execute();
    } catch {
      console.error('Exchange rate refresh failed.');
    }
  }
}
