import { Injectable } from '@nestjs/common';
import type { RefreshTokenSessionRepository } from '../../application/ports/refresh-token-session-repository.port';
import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';

@Injectable()
export class InMemoryRefreshTokenSessionRepository implements RefreshTokenSessionRepository {
  private readonly sessions = new Map<string, RefreshTokenSession>();

  findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<RefreshTokenSession | null> {
    const session = [...this.sessions.values()].find(
      (candidate) =>
        candidate.tokenHash === tokenHash &&
        !candidate.revokedAt &&
        candidate.expiresAt > now,
    );

    return Promise.resolve(session ?? null);
  }

  save(session: RefreshTokenSession): Promise<RefreshTokenSession> {
    this.sessions.set(session.id, session);
    return Promise.resolve(session);
  }

  revoke(id: string, now: Date): Promise<boolean> {
    const session = this.sessions.get(id);

    if (!session || session.revokedAt || session.expiresAt <= now) {
      return Promise.resolve(false);
    }

    session.revoke(now);
    return Promise.resolve(true);
  }
}
