import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { EmailAlreadyRegisteredError } from '../../application/errors/identity.errors';
import { UserRepository } from '../../application/ports/user-repository.port';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  findByEmail(email: Email): Promise<User | null> {
    return Promise.resolve(
      [...this.users.values()].find(
        (user) => user.email.value === email.value,
      ) ?? null,
    );
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  async save(user: User): Promise<User> {
    const existingUser = await this.findByEmail(user.email);

    if (existingUser && existingUser.id !== user.id) {
      throw new EmailAlreadyRegisteredError();
    }

    this.users.set(user.id, user);
    return user;
  }
}
