import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { EmailAlreadyRegisteredError } from '../errors/identity.errors';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { USER_REPOSITORY } from '../ports/user-repository.port';
import type { UserRepository } from '../ports/user-repository.port';
import { Email } from '../../domain/value-objects/email.value-object';
import { User, UserPublicProfile } from '../../domain/entities/user.entity';

export interface RegisterUserCommand {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserPublicProfile> {
    const email = Email.create(command.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.register({
      id: randomUUID(),
      name: command.name,
      email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
    return savedUser.toPublicProfile();
  }
}
