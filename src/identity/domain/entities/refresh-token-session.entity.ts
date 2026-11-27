interface RefreshTokenSessionProperties {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export class RefreshTokenSession {
  private constructor(
    private readonly properties: RefreshTokenSessionProperties,
  ) {}

  static create(properties: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt?: Date;
  }): RefreshTokenSession {
    if (!properties.id || !properties.userId || !properties.tokenHash) {
      throw new Error('Refresh token session data cannot be empty.');
    }

    const createdAt = properties.createdAt ?? new Date();

    if (properties.expiresAt <= createdAt) {
      throw new Error('Refresh token expiration must be in the future.');
    }

    return new RefreshTokenSession({
      ...properties,
      createdAt,
    });
  }

  static rehydrate(
    properties: RefreshTokenSessionProperties,
  ): RefreshTokenSession {
    return new RefreshTokenSession(properties);
  }

  get id(): string {
    return this.properties.id;
  }

  get userId(): string {
    return this.properties.userId;
  }

  get tokenHash(): string {
    return this.properties.tokenHash;
  }

  get expiresAt(): Date {
    return this.properties.expiresAt;
  }

  get createdAt(): Date {
    return this.properties.createdAt;
  }

  get revokedAt(): Date | undefined {
    return this.properties.revokedAt;
  }

  revoke(now: Date): void {
    this.properties.revokedAt = now;
  }
}
