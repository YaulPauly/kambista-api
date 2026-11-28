import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../../identity/domain/enums/user-role.enum';
import { Transaction } from '../../domain/entities/transaction.entity';
import {
  InvalidTransactionDateRangeError,
  InvalidTransactionPaginationError,
} from '../../domain/errors/transaction.errors';
import {
  TRANSACTION_REPOSITORY,
  TransactionHistoryCriteria,
  TransactionHistoryPage,
} from '../ports/transaction-repository.port';
import type { TransactionRepository } from '../ports/transaction-repository.port';

export interface TransactionActor {
  userId: string;
  role: UserRole;
}

export interface GetTransactionHistoryCommand {
  actor: TransactionActor;
  startDate: Date;
  endDate: Date;
  requestedUserId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransactionHistory {
  transactions: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class GetTransactionHistoryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(
    command: GetTransactionHistoryCommand,
  ): Promise<PaginatedTransactionHistory> {
    this.validateDateRange(command.startDate, command.endDate);
    const page = command.page ?? 1;
    const pageSize = command.pageSize ?? 12;
    this.validatePagination(page, pageSize);

    const criteria: TransactionHistoryCriteria = {
      userId: this.resolveTargetUserId(command),
      startDate: command.startDate,
      endDate: command.endDate,
      page,
      pageSize,
    };

    const result = await this.transactionRepository.findHistory(criteria);

    return this.toPaginatedResult(result, page, pageSize);
  }

  private toPaginatedResult(
    result: TransactionHistoryPage,
    page: number,
    pageSize: number,
  ): PaginatedTransactionHistory {
    return {
      transactions: result.transactions,
      page,
      pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  private resolveTargetUserId(
    command: GetTransactionHistoryCommand,
  ): string | undefined {
    if (command.actor.role === UserRole.ADMIN) {
      return command.requestedUserId;
    }

    return command.actor.userId;
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate.getTime() > endDate.getTime()
    ) {
      throw new InvalidTransactionDateRangeError();
    }
  }

  private validatePagination(page: number, pageSize: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidTransactionPaginationError();
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new InvalidTransactionPaginationError();
    }
  }
}
