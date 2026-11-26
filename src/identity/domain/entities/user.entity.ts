import { Email } from '../value-objects/email.value-object';
import { UserRole } from '../enums/user-role.enum';

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserProperties {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly properties: UserProperties) {}

  static register(properties: {
    id: string;
    name: string;
    email: Email;
    passwordHash: string;
    role?: UserRole;
    now?: Date;
  }): User {
    const name = properties.name.trim();

    if (!name) {
      throw new Error('User name cannot be empty.');
    }

    const now = properties.now ?? new Date();

    return new User({
      id: properties.id,
      name,
      email: properties.email,
      passwordHash: properties.passwordHash,
      role: properties.role ?? UserRole.USER,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(properties: UserProperties): User {
    return new User(properties);
  }

  get id(): string {
    return this.properties.id;
  }

  get name(): string {
    return this.properties.name;
  }

  get email(): Email {
    return this.properties.email;
  }

  get passwordHash(): string {
    return this.properties.passwordHash;
  }

  get role(): UserRole {
    return this.properties.role;
  }

  get createdAt(): Date {
    return this.properties.createdAt;
  }

  get updatedAt(): Date {
    return this.properties.updatedAt;
  }

  toPublicProfile(): UserPublicProfile {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      role: this.role,
    };
  }
}
