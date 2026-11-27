import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'transactions', versionKey: false })
export class TransactionPersistenceModel {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ required: true, trim: true })
  sourceCurrency!: string;

  @Prop({ required: true, trim: true })
  targetCurrency!: string;

  @Prop({ required: true, type: SchemaTypes.Decimal128 })
  amount!: Types.Decimal128;

  @Prop({ required: true, type: SchemaTypes.Decimal128 })
  convertedAmount!: Types.Decimal128;

  @Prop({ required: true, type: SchemaTypes.Decimal128 })
  appliedExchangeRate!: Types.Decimal128;

  @Prop({ required: true, type: Date })
  createdAt!: Date;
}

export type TransactionPersistenceDocument =
  HydratedDocument<TransactionPersistenceModel>;

export const TransactionPersistenceSchema = SchemaFactory.createForClass(
  TransactionPersistenceModel,
);

TransactionPersistenceSchema.index({ userId: 1, createdAt: -1 });
