import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { RefreshTokenSessionRepository } from '../../application/ports/refresh-token-session-repository.port';
import { RefreshTokenSession } from '../../domain/entities/refresh-token-session.entity';
import {
  RefreshTokenSessionPersistenceDocument,
  RefreshTokenSessionPersistenceModel,
} from './refresh-token-session.schema';

@Injectable()
export class MongooseRefreshTokenSessionRepository implements RefreshTokenSessionRepository {
  constructor(
    @InjectModel(RefreshTokenSessionPersistenceModel.name)
    private readonly sessionModel: Model<RefreshTokenSessionPersistenceDocument>,
  ) {}

  async findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<RefreshTokenSession | null> {
    const document = await this.sessionModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: now },
        revokedAt: { $exists: false },
      })
      .exec();

    return document ? this.toDomain(document) : null;
  }

  async save(session: RefreshTokenSession): Promise<RefreshTokenSession> {
    const document = await this.sessionModel.create({
      _id: session.id,
      userId: session.userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    });

    return this.toDomain(document);
  }

  async revoke(id: string, now: Date): Promise<boolean> {
    const result = await this.sessionModel
      .updateOne(
        {
          _id: id,
          expiresAt: { $gt: now },
          revokedAt: { $exists: false },
        },
        { revokedAt: now },
      )
      .exec();

    return result.matchedCount === 1;
  }

  private toDomain(
    document: RefreshTokenSessionPersistenceDocument,
  ): RefreshTokenSession {
    return RefreshTokenSession.rehydrate({
      id: document._id.toString(),
      userId: document.userId,
      tokenHash: document.tokenHash,
      expiresAt: document.expiresAt,
      createdAt: document.createdAt,
      revokedAt: document.revokedAt,
    });
  }
}
