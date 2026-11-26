import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ExchangeRateNotAvailableError } from '../../../exchange-rates/domain/errors/exchange-rate.errors';
import type { AuthTokenPayload } from '../../../identity/application/ports/token-service.port';
import { JwtAuthGuard } from '../../../identity/infrastructure/http/jwt-auth.guard';
import {
  SameCurrencyPairError,
  UnsupportedCurrencyError,
} from '../../../currencies/domain/errors/currency.errors';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionHistoryUseCase } from '../../application/use-cases/get-transaction-history.use-case';
import { Transaction } from '../../domain/entities/transaction.entity';
import {
  InvalidTransactionDateRangeError,
  InvalidTransactionError,
} from '../../domain/errors/transaction.errors';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionHistoryQueryDto } from './dto/transaction-history-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

type AuthenticatedTransactionRequest = Request & {
  user?: AuthTokenPayload;
};

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('v1/transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una solicitud de cambio' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'La solicitud no es válida.' })
  @ApiServiceUnavailableResponse({
    description: 'No hay un tipo de cambio disponible.',
  })
  @ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
  async create(
    @Req() request: AuthenticatedTransactionRequest,
    @Body() body: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const user = this.getAuthenticatedUser(request);

    try {
      const transaction = await this.createTransactionUseCase.execute({
        userId: user.sub,
        sourceCurrency: body.monedaOrigen,
        targetCurrency: body.monedaDestino,
        amount: body.monto,
      });

      return this.toResponse(transaction);
    } catch (error: unknown) {
      this.handleTransactionError(error);
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Consultar el historial de cambios' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-11-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-11-30' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Disponible para administradores.',
  })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  @ApiBadRequestResponse({ description: 'El filtro no es válido.' })
  @ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
  async history(
    @Req() request: AuthenticatedTransactionRequest,
    @Query() query: TransactionHistoryQueryDto,
  ): Promise<TransactionResponseDto[]> {
    const user = this.getAuthenticatedUser(request);

    try {
      const transactions = await this.getTransactionHistoryUseCase.execute({
        actor: {
          userId: user.sub,
          role: user.role,
        },
        startDate: this.toStartOfDay(query.startDate),
        endDate: this.toEndOfDay(query.endDate),
        requestedUserId: query.userId,
      });

      return transactions.map((transaction) => this.toResponse(transaction));
    } catch (error: unknown) {
      this.handleTransactionError(error);
    }
  }

  private getAuthenticatedUser(
    request: AuthenticatedTransactionRequest,
  ): AuthTokenPayload {
    if (!request.user) {
      throw new UnauthorizedException('Se requiere un usuario autenticado.');
    }

    return request.user;
  }

  private toResponse(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      monedaOrigen: transaction.pair.baseCurrency.value,
      monedaDestino: transaction.pair.quoteCurrency.value,
      monto: transaction.amount,
      montoCambiado: transaction.convertedAmount,
      tipoCambio: transaction.appliedExchangeRate,
      fecha: transaction.createdAt.toISOString(),
    };
  }

  private toStartOfDay(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private toEndOfDay(date: string): Date {
    return new Date(`${date}T23:59:59.999Z`);
  }

  private handleTransactionError(error: unknown): never {
    if (
      error instanceof SameCurrencyPairError ||
      error instanceof UnsupportedCurrencyError ||
      error instanceof InvalidTransactionError ||
      error instanceof InvalidTransactionDateRangeError
    ) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof ExchangeRateNotAvailableError) {
      throw new ServiceUnavailableException(error.message);
    }

    throw error;
  }
}
