import { randomUUID } from 'node:crypto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PASSWORD_HASHER } from '../../application/ports/password-hasher.port';
import type { PasswordHasher } from '../../application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../../application/ports/user-repository.port';
import type { UserRepository } from '../../application/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { Email } from '../../domain/value-objects/email.value-object';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      return;
    }

    const email = Email.create(adminEmail);
    const existingAdmin = await this.userRepository.findByEmail(email);

    if (existingAdmin) {
      return;
    }

    const admin = User.register({
      id: randomUUID(),
      name: this.configService.get<string>('ADMIN_NAME', 'Administrator'),
      email,
      passwordHash: await this.passwordHasher.hash(adminPassword),
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(admin);
  }
}
