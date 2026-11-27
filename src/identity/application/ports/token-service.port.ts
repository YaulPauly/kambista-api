import { UserRole } from '../../domain/enums/user-role.enum';

export interface AuthTokenPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenType: 'refresh';
}

export interface RefreshTokenResult {
  token: string;
  tokenId: string;
  expiresAt: Date;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
  signRefreshToken(userId: string): Promise<RefreshTokenResult>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
