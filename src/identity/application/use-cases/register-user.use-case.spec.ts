import { EmailAlreadyRegisteredError } from '../errors/identity.errors';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { UserRepository } from '../ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import {
  Email,
  InvalidEmailError,
} from '../../domain/value-objects/email.value-object';
import { RegisterUserUseCase } from './register-user.use-case';

class FakeUserRepository implements UserRepository {
  readonly users: User[] = [];
  readonly findByEmailCalls: Email[] = [];
  readonly saveCalls: User[] = [];

  findByEmail = (email: Email): Promise<User | null> => {
    this.findByEmailCalls.push(email);
    return Promise.resolve(
      this.users.find((user) => user.email.value === email.value) ?? null,
    );
  };

  findById = (): Promise<User | null> => Promise.resolve(null);

  save = (user: User): Promise<User> => {
    this.saveCalls.push(user);
    this.users.push(user);
    return Promise.resolve(user);
  };
}

class FakePasswordHasher implements PasswordHasher {
  readonly hashCalls: string[] = [];

  hash = (value: string): Promise<string> => {
    this.hashCalls.push(value);
    return Promise.resolve('hashed-password');
  };

  compare = (): Promise<boolean> => Promise.resolve(false);
}

describe('RegisterUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    useCase = new RegisterUserUseCase(userRepository, passwordHasher);
  });

  it('registers a user with a normalized email and default user role', async () => {
    const result = await useCase.execute({
      name: ' Juan Pérez ',
      email: 'JUAN@example.com',
      password: 'Contraseña123',
    });

    expect(passwordHasher.hashCalls).toEqual(['Contraseña123']);
    expect(userRepository.saveCalls[0]).toMatchObject({
      name: 'Juan Pérez',
      passwordHash: 'hashed-password',
      role: UserRole.USER,
    });
    expect(result).toMatchObject({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: UserRole.USER,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an already registered email before hashing the password', async () => {
    userRepository.users.push(
      User.register({
        id: 'existing-user-id',
        name: 'Existing User',
        email: Email.create('juan@example.com'),
        passwordHash: 'existing-hash',
      }),
    );

    await expect(
      useCase.execute({
        name: 'Juan Pérez',
        email: 'JUAN@example.com',
        password: 'Contraseña123',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);

    expect(passwordHasher.hashCalls).toEqual([]);
    expect(userRepository.saveCalls).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    await expect(
      useCase.execute({
        name: 'Juan Pérez',
        email: 'invalid-email',
        password: 'Contraseña123',
      }),
    ).rejects.toBeInstanceOf(InvalidEmailError);

    expect(userRepository.findByEmailCalls).toEqual([]);
  });
});
