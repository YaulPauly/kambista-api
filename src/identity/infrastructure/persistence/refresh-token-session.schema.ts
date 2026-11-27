import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'refresh_token_sessions', versionKey: false })
export class RefreshTokenSessionPersistenceModel {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ index: true, required: true, type: String })
  userId!: string;

  @Prop({ required: true, type: String, unique: true })
  tokenHash!: string;

  @Prop({ expires: 0, required: true, type: Date })
  expiresAt!: Date;

  @Prop({ required: true, type: Date })
  createdAt!: Date;

  @Prop({ required: false, type: Date })
  revokedAt?: Date;
}

export type RefreshTokenSessionPersistenceDocument =
  HydratedDocument<RefreshTokenSessionPersistenceModel>;
export const RefreshTokenSessionPersistenceSchema =
  SchemaFactory.createForClass(RefreshTokenSessionPersistenceModel);
