import { InvalidCredentialsError } from '../errors/identity.errors';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type {
  AuthTokenPayload,
  RefreshTokenPayload,
  RefreshTokenResult,
  TokenService,
} from '../ports/token-service.port';
import type { RefreshTokenHasher } from '../ports/refresh-token-hasher.port';
import type { RefreshTokenSessionRepository } from '../ports/refresh-token-session-repository.port';
import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';
import type { UserRepository } from '../ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import {
  Email,
  InvalidEmailError,
} from '../../domain/value-objects/email.value-object';
import { LoginUserUseCase } from './login-user.use-case';

class FakeUserRepository implements UserRepository {
  user: User | null = null;
  readonly findByEmailCalls: Email[] = [];

  findByEmail = (email: Email): Promise<User | null> => {
    this.findByEmailCalls.push(email);
    return Promise.resolve(
      this.user?.email.value === email.value ? this.user : null,
    );
  };

  save = (user: User): Promise<User> => Promise.resolve(user);

  findById = (id: string): Promise<User | null> =>
    Promise.resolve(this.user?.id === id ? this.user : null);
}

class FakePasswordHasher implements PasswordHasher {
  compareResult = false;
  readonly compareCalls: Array<{ value: string; hash: string }> = [];

  hash = (): Promise<string> => Promise.resolve('hashed-password');

  compare = (value: string, hash: string): Promise<boolean> => {
    this.compareCalls.push({ value, hash });
    return Promise.resolve(this.compareResult);
  };
}

class FakeTokenService implements TokenService {
  readonly signCalls: AuthTokenPayload[] = [];
  readonly refreshSignCalls: string[] = [];

  sign = (payload: AuthTokenPayload): Promise<string> => {
    this.signCalls.push(payload);
    return Promise.resolve('access-token');
  };

  verify = (): Promise<AuthTokenPayload> =>
    Promise.reject(new Error('Not implemented in this fake.'));

  signRefreshToken = (userId: string): Promise<RefreshTokenResult> => {
    this.refreshSignCalls.push(userId);
    return Promise.resolve({
      token: 'refresh-token',
      tokenId: 'refresh-token-id',
      expiresAt: new Date(Date.now() + 86_400_000),
    });
  };

  verifyRefreshToken = (): Promise<RefreshTokenPayload> =>
    Promise.reject(new Error('Not implemented in this fake.'));
}

class FakeRefreshTokenSessionRepository implements RefreshTokenSessionRepository {
  readonly sessions: RefreshTokenSession[] = [];

  findActiveByTokenHash = (): Promise<RefreshTokenSession | null> =>
    Promise.resolve(null);

  save = (session: RefreshTokenSession): Promise<RefreshTokenSession> => {
    this.sessions.push(session);
    return Promise.resolve(session);
  };

  revoke = (): Promise<boolean> => Promise.resolve(true);
}

class FakeRefreshTokenHasher implements RefreshTokenHasher {
  hash = (value: string): string => `hash:${value}`;
}

describe('LoginUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let refreshTokenSessionRepository: FakeRefreshTokenSessionRepository;
  let refreshTokenHasher: FakeRefreshTokenHasher;
  let useCase: LoginUserUseCase;
  let user: User;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    refreshTokenSessionRepository = new FakeRefreshTokenSessionRepository();
    refreshTokenHasher = new FakeRefreshTokenHasher();
    useCase = new LoginUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
      refreshTokenSessionRepository,
      refreshTokenHasher,
    );
    user = User.register({
      id: 'user-id',
      name: 'Juan Pérez',
      email: Email.create('juan@example.com'),
      passwordHash: 'hashed-password',
    });
    userRepository.user = user;
  });

  it('returns a public user profile and access token for valid credentials', async () => {
    passwordHasher.compareResult = true;

    const result = await useCase.execute({
      email: 'JUAN@example.com',
      password: 'Contraseña123',
    });

    const expectedPayload: AuthTokenPayload = {
      sub: 'user-id',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: UserRole.USER,
    };

    expect(passwordHasher.compareCalls).toEqual([
      {
        value: 'Contraseña123',
        hash: 'hashed-password',
      },
    ]);
    expect(tokenService.signCalls).toEqual([expectedPayload]);
    expect(tokenService.refreshSignCalls).toEqual(['user-id']);
    expect(refreshTokenSessionRepository.sessions[0]).toMatchObject({
      id: 'refresh-token-id',
      userId: 'user-id',
      tokenHash: 'hash:refresh-token',
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        role: UserRole.USER,
      },
    });
  });

  it('rejects an incorrect password', async () => {
    await expect(
      useCase.execute({
        email: 'juan@example.com',
        password: 'WrongPassword123',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(tokenService.signCalls).toEqual([]);
    expect(tokenService.refreshSignCalls).toEqual([]);
  });

  it('rejects an unknown user with the same authentication error', async () => {
    userRepository.user = null;

    await expect(
      useCase.execute({
        email: 'unknown@example.com',
        password: 'Contraseña123',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(passwordHasher.compareCalls).toEqual([]);
    expect(tokenService.signCalls).toEqual([]);
    expect(tokenService.refreshSignCalls).toEqual([]);
  });

  it('rejects an invalid email before accessing the repository', async () => {
    await expect(
      useCase.execute({
        email: 'invalid-email',
        password: 'Contraseña123',
      }),
    ).rejects.toBeInstanceOf(InvalidEmailError);

    expect(userRepository.findByEmailCalls).toEqual([]);
  });
});
