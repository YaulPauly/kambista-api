import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailAlreadyRegisteredError } from '../../application/errors/identity.errors';
import { UserRepository } from '../../application/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserPersistenceDocument, UserPersistenceModel } from './user.schema';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserPersistenceModel.name)
    private readonly userModel: Model<UserPersistenceDocument>,
  ) {}

  async findByEmail(email: Email): Promise<User | null> {
    const document = await this.userModel
      .findOne({ email: email.value })
      .select('+passwordHash')
      .exec();

    return document ? this.toDomain(document) : null;
  }

  async findById(id: string): Promise<User | null> {
    const document = await this.userModel
      .findById(id)
      .select('+passwordHash')
      .exec();

    return document ? this.toDomain(document) : null;
  }

  async save(user: User): Promise<User> {
    try {
      const document = await this.userModel.create({
        _id: user.id,
        name: user.name,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role,
      });

      return this.toDomain(document);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }

  private toDomain(document: UserPersistenceDocument): User {
    return User.rehydrate({
      id: document._id.toString(),
      name: document.name,
      email: Email.create(document.email),
      passwordHash: document.passwordHash,
      role: document.role,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
