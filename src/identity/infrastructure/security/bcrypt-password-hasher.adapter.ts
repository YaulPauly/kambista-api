import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly configService: ConfigService) {}

  hash(value: string): Promise<string> {
    return bcrypt.hash(
      value,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    );
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
