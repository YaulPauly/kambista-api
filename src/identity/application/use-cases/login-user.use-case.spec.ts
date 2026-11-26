import { InvalidCredentialsError } from '../errors/identity.errors';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type {
  AuthTokenPayload,
  TokenService,
} from '../ports/token-service.port';
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

  sign = (payload: AuthTokenPayload): Promise<string> => {
    this.signCalls.push(payload);
    return Promise.resolve('access-token');
  };

  verify = (): Promise<AuthTokenPayload> =>
    Promise.reject(new Error('Not implemented in this fake.'));
}

describe('LoginUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let useCase: LoginUserUseCase;
  let user: User;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    useCase = new LoginUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
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
    expect(result).toEqual({
      accessToken: 'access-token',
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
