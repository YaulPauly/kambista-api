import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({})
export class MongoDbModule {
  static register(): DynamicModule {
    const useMongoPersistence =
      process.env.NODE_ENV !== 'test' && Boolean(process.env.MONGODB_URI);

    return {
      module: MongoDbModule,
      imports: useMongoPersistence
        ? [MongooseModule.forRoot(process.env.MONGODB_URI as string)]
        : [],
    };
  }
}
