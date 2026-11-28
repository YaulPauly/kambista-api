import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import {
  SameCurrencyPairError,
  UnsupportedCurrencyError,
} from '../../../currencies/domain/errors/currency.errors';
import { JwtAuthGuard } from '../../../identity/infrastructure/http/jwt-auth.guard';
import { ExchangeRateNotAvailableError } from '../../domain/errors/exchange-rate.errors';
import { GetLatestExchangeRateUseCase } from '../../application/use-cases/get-latest-exchange-rate.use-case';
import { GetExchangeRateQueryDto } from './dto/get-exchange-rate-query.dto';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';

@ApiTags('exchange-rates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('v1/exchange-rates')
export class ExchangeRatesController {
  constructor(
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar el tipo de cambio actual' })
  @ApiOkResponse({ type: ExchangeRateResponseDto })
  @ApiBadRequestResponse({ description: 'El par de monedas no es válido.' })
  @ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
  @ApiServiceUnavailableResponse({
    description: 'No hay un tipo de cambio disponible.',
  })
  async getLatest(
    @Query() query: GetExchangeRateQueryDto,
  ): Promise<ExchangeRateResponseDto> {
    try {
      const exchangeRate = await this.getLatestExchangeRateUseCase.execute({
        baseCurrency: query.monedaOrigen,
        quoteCurrency: query.monedaDestino,
      });

      return {
        monedaOrigen: exchangeRate.pair.baseCurrency.value,
        monedaDestino: exchangeRate.pair.quoteCurrency.value,
        compra: exchangeRate.purchaseRate.toNumber(),
        venta: exchangeRate.saleRate.toNumber(),
        fuente: exchangeRate.source,
        fechaEfectiva: exchangeRate.effectiveDate.toISOString(),
        consultadoEn: exchangeRate.fetchedAt.toISOString(),
      };
    } catch (error: unknown) {
      if (
        error instanceof SameCurrencyPairError ||
        error instanceof UnsupportedCurrencyError
      ) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof ExchangeRateNotAvailableError) {
        throw new ServiceUnavailableException(error.message);
      }

      throw error;
    }
  }
}
