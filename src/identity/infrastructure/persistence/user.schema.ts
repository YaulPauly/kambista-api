import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../domain/enums/user-role.enum';

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class UserPersistenceModel {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ maxlength: 120, required: true, trim: true })
  name!: string;

  @Prop({ index: true, lowercase: true, required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ enum: UserRole, required: true, type: String })
  role!: UserRole;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserPersistenceDocument = HydratedDocument<UserPersistenceModel>;
export const UserPersistenceSchema =
  SchemaFactory.createForClass(UserPersistenceModel);
