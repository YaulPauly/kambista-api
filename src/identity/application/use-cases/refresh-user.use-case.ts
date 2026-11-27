import { Inject, Injectable } from '@nestjs/common';
import type { UserPublicProfile } from '../../domain/entities/user.entity';
import { InvalidRefreshTokenError } from '../errors/identity.errors';
import { REFRESH_TOKEN_HASHER } from '../ports/refresh-token-hasher.port';
import type { RefreshTokenHasher } from '../ports/refresh-token-hasher.port';
import { REFRESH_TOKEN_SESSION_REPOSITORY } from '../ports/refresh-token-session-repository.port';
import type { RefreshTokenSessionRepository } from '../ports/refresh-token-session-repository.port';
import { TOKEN_SERVICE } from '../ports/token-service.port';
import type {
  AuthTokenPayload,
  TokenService,
} from '../ports/token-service.port';
import { USER_REPOSITORY } from '../ports/user-repository.port';
import type { UserRepository } from '../ports/user-repository.port';
import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';

export interface RefreshUserCommand {
  refreshToken: string;
}

export interface RefreshUserResult {
  accessToken: string;
  refreshToken: string;
  user: UserPublicProfile;
}

@Injectable()
export class RefreshUserUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_SESSION_REPOSITORY)
    private readonly refreshTokenSessionRepository: RefreshTokenSessionRepository,
    @Inject(REFRESH_TOKEN_HASHER)
    private readonly refreshTokenHasher: RefreshTokenHasher,
  ) {}

  async execute(command: RefreshUserCommand): Promise<RefreshUserResult> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(
        command.refreshToken,
      );
      const now = new Date();
      const session =
        await this.refreshTokenSessionRepository.findActiveByTokenHash(
          this.refreshTokenHasher.hash(command.refreshToken),
          now,
        );

      if (
        !session ||
        session.id !== payload.jti ||
        session.userId !== payload.sub
      ) {
        throw new InvalidRefreshTokenError();
      }

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new InvalidRefreshTokenError();
      }

      const revoked = await this.refreshTokenSessionRepository.revoke(
        session.id,
        now,
      );

      if (!revoked) {
        throw new InvalidRefreshTokenError();
      }

      const accessToken = await this.tokenService.sign(
        this.toAccessPayload(user),
      );
      const signedRefreshToken = await this.tokenService.signRefreshToken(
        user.id,
      );
      await this.saveRefreshTokenSession(user.id, signedRefreshToken);

      return {
        accessToken,
        refreshToken: signedRefreshToken.token,
        user: user.toPublicProfile(),
      };
    } catch (error: unknown) {
      if (error instanceof InvalidRefreshTokenError) {
        throw error;
      }

      throw new InvalidRefreshTokenError();
    }
  }

  private toAccessPayload(user: {
    id: string;
    name: string;
    email: { value: string };
    role: UserPublicProfile['role'];
  }): AuthTokenPayload {
    return {
      sub: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
    };
  }

  private async saveRefreshTokenSession(
    userId: string,
    signedRefreshToken: Awaited<ReturnType<TokenService['signRefreshToken']>>,
  ): Promise<void> {
    await this.refreshTokenSessionRepository.save(
      RefreshTokenSession.create({
        id: signedRefreshToken.tokenId,
        userId,
        tokenHash: this.refreshTokenHasher.hash(signedRefreshToken.token),
        expiresAt: signedRefreshToken.expiresAt,
      }),
    );
  }
}
