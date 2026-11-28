import { UserRole } from '../../../identity/domain/enums/user-role.enum';
import { Transaction } from '../../domain/entities/transaction.entity';
import {
  InvalidTransactionDateRangeError,
  InvalidTransactionPaginationError,
} from '../../domain/errors/transaction.errors';
import type {
  TransactionHistoryCriteria,
  TransactionHistoryPage,
  TransactionRepository,
} from '../ports/transaction-repository.port';
import { GetTransactionHistoryUseCase } from './get-transaction-history.use-case';

class FakeTransactionRepository implements TransactionRepository {
  receivedCriteria?: TransactionHistoryCriteria;

  save = (transaction: Transaction): Promise<Transaction> =>
    Promise.resolve(transaction);

  findHistory = (
    criteria: TransactionHistoryCriteria,
  ): Promise<TransactionHistoryPage> => {
    this.receivedCriteria = criteria;
    return Promise.resolve({ transactions: [], total: 0 });
  };
}

describe('GetTransactionHistoryUseCase', () => {
  it('limits a user to their own history', async () => {
    const repository = new FakeTransactionRepository();
    const useCase = new GetTransactionHistoryUseCase(repository);

    await useCase.execute({
      actor: { userId: 'user-id', role: UserRole.USER },
      requestedUserId: 'another-user-id',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T23:59:59.999Z'),
    });

    expect(repository.receivedCriteria?.userId).toBe('user-id');
  });

  it('allows an admin to query another user history', async () => {
    const repository = new FakeTransactionRepository();
    const useCase = new GetTransactionHistoryUseCase(repository);

    await useCase.execute({
      actor: { userId: 'admin-id', role: UserRole.ADMIN },
      requestedUserId: 'another-user-id',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T23:59:59.999Z'),
    });

    expect(repository.receivedCriteria?.userId).toBe('another-user-id');
  });

  it('allows an admin to query all users history without a user filter', async () => {
    const repository = new FakeTransactionRepository();
    const useCase = new GetTransactionHistoryUseCase(repository);

    await useCase.execute({
      actor: { userId: 'admin-id', role: UserRole.ADMIN },
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T23:59:59.999Z'),
    });

    expect(repository.receivedCriteria?.userId).toBeUndefined();
  });

  it('uses the default pagination and returns metadata', async () => {
    const repository = new FakeTransactionRepository();
    const useCase = new GetTransactionHistoryUseCase(repository);

    const result = await useCase.execute({
      actor: { userId: 'user-id', role: UserRole.USER },
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T23:59:59.999Z'),
    });

    expect(repository.receivedCriteria).toMatchObject({
      page: 1,
      pageSize: 12,
    });
    expect(result).toMatchObject({
      page: 1,
      pageSize: 12,
      total: 0,
      totalPages: 0,
      transactions: [],
    });
  });

  it('rejects an invalid page size', async () => {
    const useCase = new GetTransactionHistoryUseCase(
      new FakeTransactionRepository(),
    );

    await expect(
      useCase.execute({
        actor: { userId: 'user-id', role: UserRole.USER },
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2026-11-30T23:59:59.999Z'),
        pageSize: 101,
      }),
    ).rejects.toBeInstanceOf(InvalidTransactionPaginationError);
  });

  it('rejects an inverted date range', async () => {
    const useCase = new GetTransactionHistoryUseCase(
      new FakeTransactionRepository(),
    );

    await expect(
      useCase.execute({
        actor: { userId: 'user-id', role: UserRole.USER },
        startDate: new Date('2026-11-30T00:00:00.000Z'),
        endDate: new Date('2026-11-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidTransactionDateRangeError);
  });
});
