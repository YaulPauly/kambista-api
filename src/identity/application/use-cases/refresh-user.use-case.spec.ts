import { InvalidRefreshTokenError } from '../errors/identity.errors';
import type { RefreshTokenHasher } from '../ports/refresh-token-hasher.port';
import type { RefreshTokenSessionRepository } from '../ports/refresh-token-session-repository.port';
import type {
  AuthTokenPayload,
  RefreshTokenPayload,
  RefreshTokenResult,
  TokenService,
} from '../ports/token-service.port';
import type { UserRepository } from '../ports/user-repository.port';
import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { Email } from '../../domain/value-objects/email.value-object';
import { RefreshUserUseCase } from './refresh-user.use-case';

class FakeTokenService implements TokenService {
  refreshPayload: RefreshTokenPayload | null = null;
  readonly accessTokenPayloads: AuthTokenPayload[] = [];
  private refreshTokenSequence = 0;

  sign = (payload: AuthTokenPayload): Promise<string> => {
    this.accessTokenPayloads.push(payload);
    return Promise.resolve('new-access-token');
  };

  verify = (): Promise<AuthTokenPayload> =>
    Promise.reject(new Error('Not implemented in this fake.'));

  signRefreshToken = (): Promise<RefreshTokenResult> => {
    this.refreshTokenSequence += 1;
    return Promise.resolve({
      token: `new-refresh-token-${this.refreshTokenSequence}`,
      tokenId: `new-refresh-token-id-${this.refreshTokenSequence}`,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
  };

  verifyRefreshToken = (): Promise<RefreshTokenPayload> => {
    if (!this.refreshPayload) {
      return Promise.reject(new Error('Invalid refresh token.'));
    }

    return Promise.resolve(this.refreshPayload);
  };
}

class FakeUserRepository implements UserRepository {
  constructor(private readonly user: User) {}

  findByEmail = (): Promise<User | null> => Promise.resolve(null);

  findById = (id: string): Promise<User | null> =>
    Promise.resolve(id === this.user.id ? this.user : null);

  save = (user: User): Promise<User> => Promise.resolve(user);
}

class FakeRefreshTokenSessionRepository implements RefreshTokenSessionRepository {
  constructor(private readonly activeSession: RefreshTokenSession) {}

  readonly savedSessions: RefreshTokenSession[] = [];

  findActiveByTokenHash = (
    tokenHash: string,
  ): Promise<RefreshTokenSession | null> =>
    Promise.resolve(
      tokenHash === this.activeSession.tokenHash ? this.activeSession : null,
    );

  save = (session: RefreshTokenSession): Promise<RefreshTokenSession> => {
    this.savedSessions.push(session);
    return Promise.resolve(session);
  };

  revoke = (id: string, now: Date): Promise<boolean> => {
    if (id === this.activeSession.id) {
      this.activeSession.revoke(now);
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  };
}

class FakeRefreshTokenHasher implements RefreshTokenHasher {
  hash = (value: string): string => `hash:${value}`;
}

describe('RefreshUserUseCase', () => {
  it('rotates a valid refresh token and revokes the previous session', async () => {
    const user = User.register({
      id: 'user-id',
      name: 'Juan Pérez',
      email: Email.create('juan@example.com'),
      passwordHash: 'hashed-password',
      role: UserRole.USER,
    });
    const session = RefreshTokenSession.create({
      id: 'refresh-id',
      userId: user.id,
      tokenHash: 'hash:old-refresh-token',
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    const tokenService = new FakeTokenService();
    tokenService.refreshPayload = {
      sub: user.id,
      jti: session.id,
      tokenType: 'refresh',
    };
    const sessionRepository = new FakeRefreshTokenSessionRepository(session);
    const useCase = new RefreshUserUseCase(
      tokenService,
      new FakeUserRepository(user),
      sessionRepository,
      new FakeRefreshTokenHasher(),
    );

    const result = await useCase.execute({
      refreshToken: 'old-refresh-token',
    });

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token-1');
    expect(session.revokedAt).toBeInstanceOf(Date);
    expect(sessionRepository.savedSessions).toHaveLength(1);
    expect(tokenService.accessTokenPayloads[0]).toMatchObject({
      sub: user.id,
      role: UserRole.USER,
    });
  });

  it('rejects an invalid refresh token', async () => {
    const user = User.register({
      id: 'user-id',
      name: 'Juan Pérez',
      email: Email.create('juan@example.com'),
      passwordHash: 'hashed-password',
    });
    const useCase = new RefreshUserUseCase(
      new FakeTokenService(),
      new FakeUserRepository(user),
      new FakeRefreshTokenSessionRepository(
        RefreshTokenSession.create({
          id: 'refresh-id',
          userId: user.id,
          tokenHash: 'hash:refresh-token',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      ),
      new FakeRefreshTokenHasher(),
    );

    await expect(
      useCase.execute({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
