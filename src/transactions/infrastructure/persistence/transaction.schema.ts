import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'transactions', versionKey: false })
export class TransactionPersistenceModel {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ required: true, trim: true })
  sourceCurrency!: string;

  @Prop({ required: true, trim: true })
  targetCurrency!: string;

  @Prop({ required: true, min: 0, type: Number })
  amount!: number;

  @Prop({ required: true, min: 0, type: Number })
  convertedAmount!: number;

  @Prop({ required: true, min: 0, type: Number })
  appliedExchangeRate!: number;

  @Prop({ required: true, type: Date, index: true })
  createdAt!: Date;
}

export type TransactionPersistenceDocument =
  HydratedDocument<TransactionPersistenceModel>;

export const TransactionPersistenceSchema = SchemaFactory.createForClass(
  TransactionPersistenceModel,
);

TransactionPersistenceSchema.index({ userId: 1, createdAt: -1 });
