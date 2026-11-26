import { UserRole } from '../../domain/enums/user-role.enum';

export interface AuthTokenPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}
