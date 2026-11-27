import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  AuthTokenPayload,
  RefreshTokenPayload,
  RefreshTokenResult,
  TokenService,
} from '../../application/ports/token-service.port';

type JwtExpiration = `${number}${'s' | 'm' | 'h' | 'd'}`;

interface SignedAccessTokenPayload extends AuthTokenPayload {
  tokenType: 'access';
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  sign(payload: AuthTokenPayload): Promise<string> {
    const accessPayload: SignedAccessTokenPayload = {
      ...payload,
      tokenType: 'access',
    };

    return this.jwtService.signAsync(accessPayload);
  }

  async verify(token: string): Promise<AuthTokenPayload> {
    const payload =
      await this.jwtService.verifyAsync<SignedAccessTokenPayload>(token);

    if (payload.tokenType !== 'access') {
      throw new Error('Invalid access token type.');
    }

    return payload;
  }

  async signRefreshToken(userId: string): Promise<RefreshTokenResult> {
    const tokenId = randomUUID();
    const expiresIn = this.configService.get<JwtExpiration>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const payload: RefreshTokenPayload = {
      sub: userId,
      jti: tokenId,
      tokenType: 'refresh',
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });

    return {
      token,
      tokenId,
      expiresAt: new Date(Date.now() + this.toMilliseconds(expiresIn)),
    };
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService
      .verifyAsync<RefreshTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .then((payload) => {
        if (
          payload.tokenType !== 'refresh' ||
          typeof payload.jti !== 'string' ||
          typeof payload.sub !== 'string'
        ) {
          throw new Error('Invalid refresh token payload.');
        }

        return payload;
      });
  }

  private toMilliseconds(expiresIn: JwtExpiration): number {
    const value = Number.parseInt(expiresIn, 10);
    const unit = expiresIn.at(-1);
    const multipliers = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    } as const;

    return value * multipliers[unit as keyof typeof multipliers];
  }
}
