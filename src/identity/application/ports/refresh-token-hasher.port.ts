export const REFRESH_TOKEN_HASHER = Symbol('REFRESH_TOKEN_HASHER');

export interface RefreshTokenHasher {
  hash(value: string): string;
}
