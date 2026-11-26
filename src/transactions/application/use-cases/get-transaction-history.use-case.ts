import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../../identity/domain/enums/user-role.enum';
import { Transaction } from '../../domain/entities/transaction.entity';
import { InvalidTransactionDateRangeError } from '../../domain/errors/transaction.errors';
import {
  TRANSACTION_REPOSITORY,
  TransactionHistoryCriteria,
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
}

@Injectable()
export class GetTransactionHistoryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(command: GetTransactionHistoryCommand): Promise<Transaction[]> {
    this.validateDateRange(command.startDate, command.endDate);

    const criteria: TransactionHistoryCriteria = {
      userId: this.resolveTargetUserId(command),
      startDate: command.startDate,
      endDate: command.endDate,
    };

    return this.transactionRepository.findHistory(criteria);
  }

  private resolveTargetUserId(command: GetTransactionHistoryCommand): string {
    if (command.actor.role === UserRole.ADMIN && command.requestedUserId) {
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
}
