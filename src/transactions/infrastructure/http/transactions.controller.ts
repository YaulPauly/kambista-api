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
import { SkipThrottle } from '@nestjs/throttler';
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
  InvalidTransactionPaginationError,
} from '../../domain/errors/transaction.errors';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionHistoryQueryDto } from './dto/transaction-history-query.dto';
import {
  TransactionHistoryResponseDto,
  TransactionResponseDto,
} from './dto/transaction-response.dto';

type AuthenticatedTransactionRequest = Request & {
  user?: AuthTokenPayload;
};

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('v1/transactions')
@SkipThrottle()
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
    description:
      'Disponible para administradores. Si se omite, consulta todos los usuarios.',
  })
  @ApiOkResponse({ type: TransactionHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'El filtro no es válido.' })
  @ApiUnauthorizedResponse({ description: 'Se requiere autenticación.' })
  async history(
    @Req() request: AuthenticatedTransactionRequest,
    @Query() query: TransactionHistoryQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
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
        page: query.page,
        pageSize: query.pageSize,
      });

      return {
        data: transactions.transactions.map((transaction) =>
          this.toResponse(transaction),
        ),
        meta: {
          page: transactions.page,
          pageSize: transactions.pageSize,
          total: transactions.total,
          totalPages: transactions.totalPages,
        },
      };
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
      monto: transaction.amount.toNumber(),
      montoCambiado: transaction.convertedAmount.toNumber(),
      tipoCambio: transaction.appliedExchangeRate.toNumber(),
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
      error instanceof InvalidTransactionDateRangeError ||
      error instanceof InvalidTransactionPaginationError
    ) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof ExchangeRateNotAvailableError) {
      throw new ServiceUnavailableException(error.message);
    }

    throw error;
  }
}
