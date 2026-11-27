import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'exchange_rates', versionKey: false })
export class ExchangeRatePersistenceModel {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ required: true, trim: true })
  baseCurrency!: string;

  @Prop({ required: true, trim: true })
  quoteCurrency!: string;

  @Prop({ required: true, type: SchemaTypes.Decimal128 })
  purchaseRate!: Types.Decimal128;

  @Prop({ required: true, type: SchemaTypes.Decimal128 })
  saleRate!: Types.Decimal128;

  @Prop({ required: true, trim: true })
  source!: string;

  @Prop({ required: true, type: Date })
  effectiveDate!: Date;

  @Prop({ required: true, type: Date })
  fetchedAt!: Date;
}

export type ExchangeRatePersistenceDocument =
  HydratedDocument<ExchangeRatePersistenceModel>;

export const ExchangeRatePersistenceSchema = SchemaFactory.createForClass(
  ExchangeRatePersistenceModel,
);

ExchangeRatePersistenceSchema.index({
  baseCurrency: 1,
  quoteCurrency: 1,
  fetchedAt: -1,
});
