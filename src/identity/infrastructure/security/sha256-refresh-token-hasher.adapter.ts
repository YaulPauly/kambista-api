import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { RefreshTokenHasher } from '../../application/ports/refresh-token-hasher.port';

@Injectable()
export class Sha256RefreshTokenHasher implements RefreshTokenHasher {
  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
