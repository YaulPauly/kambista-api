import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';

export const REFRESH_TOKEN_SESSION_REPOSITORY = Symbol(
  'REFRESH_TOKEN_SESSION_REPOSITORY',
);

export interface RefreshTokenSessionRepository {
  findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<RefreshTokenSession | null>;
  save(session: RefreshTokenSession): Promise<RefreshTokenSession>;
  revoke(id: string, now: Date): Promise<boolean>;
}
