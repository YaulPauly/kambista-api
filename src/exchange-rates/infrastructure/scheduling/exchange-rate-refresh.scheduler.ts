import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshExchangeRateUseCase } from '../../application/use-cases/refresh-exchange-rate.use-case';

@Injectable()
export class ExchangeRateRefreshScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private refreshInterval?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(ExchangeRateRefreshScheduler.name);

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
    const startedAt = process.hrtime.bigint();

    try {
      await this.refreshExchangeRateUseCase.execute();
      this.logger.log(
        JSON.stringify({
          event: 'exchange_rate_refresh_succeeded',
          provider: 'sunat',
          durationMs: this.getDurationMs(startedAt),
        }),
      );
    } catch (error: unknown) {
      this.logger.error(
        JSON.stringify({
          event: 'exchange_rate_refresh_failed',
          provider: 'sunat',
          durationMs: this.getDurationMs(startedAt),
          errorType: error instanceof Error ? error.name : 'UnknownError',
        }),
      );
    }
  }

  private getDurationMs(startedAt: bigint): number {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    return Number(durationMs.toFixed(2));
  }
}
