import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { REFRESH_TOKEN_HASHER } from './application/ports/refresh-token-hasher.port';
import { REFRESH_TOKEN_SESSION_REPOSITORY } from './application/ports/refresh-token-session-repository.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshUserUseCase } from './application/use-cases/refresh-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { IdentityController } from './infrastructure/http/identity.controller';
import { JwtAuthGuard } from './infrastructure/http/jwt-auth.guard';
import { RolesGuard } from './infrastructure/http/roles.guard';
import { InMemoryUserRepository } from './infrastructure/persistence/in-memory-user.repository';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import { InMemoryRefreshTokenSessionRepository } from './infrastructure/persistence/in-memory-refresh-token-session.repository';
import { MongooseRefreshTokenSessionRepository } from './infrastructure/persistence/mongoose-refresh-token-session.repository';
import { AdminSeeder } from './infrastructure/persistence/admin.seeder';
import {
  UserPersistenceModel,
  UserPersistenceSchema,
} from './infrastructure/persistence/user.schema';
import {
  RefreshTokenSessionPersistenceModel,
  RefreshTokenSessionPersistenceSchema,
} from './infrastructure/persistence/refresh-token-session.schema';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.adapter';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { Sha256RefreshTokenHasher } from './infrastructure/security/sha256-refresh-token-hasher.adapter';

type JwtExpiration = `${number}${'s' | 'm' | 'h' | 'd'}`;

@Module({})
export class IdentityModule {
  static register(): DynamicModule {
    const useMongoPersistence =
      process.env.NODE_ENV !== 'test' && Boolean(process.env.MONGODB_URI);
    const imports: DynamicModule['imports'] = [
      ConfigModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get<JwtExpiration>(
              'JWT_EXPIRES_IN',
              '15m',
            ),
          },
        }),
      }),
    ];

    const persistenceProviders = useMongoPersistence
      ? [
          MongooseUserRepository,
          {
            provide: USER_REPOSITORY,
            useExisting: MongooseUserRepository,
          },
          MongooseRefreshTokenSessionRepository,
          {
            provide: REFRESH_TOKEN_SESSION_REPOSITORY,
            useExisting: MongooseRefreshTokenSessionRepository,
          },
        ]
      : [
          InMemoryUserRepository,
          {
            provide: USER_REPOSITORY,
            useExisting: InMemoryUserRepository,
          },
          InMemoryRefreshTokenSessionRepository,
          {
            provide: REFRESH_TOKEN_SESSION_REPOSITORY,
            useExisting: InMemoryRefreshTokenSessionRepository,
          },
        ];

    if (useMongoPersistence) {
      imports.push(
        MongooseModule.forFeature([
          {
            name: UserPersistenceModel.name,
            schema: UserPersistenceSchema,
          },
          {
            name: RefreshTokenSessionPersistenceModel.name,
            schema: RefreshTokenSessionPersistenceSchema,
          },
        ]),
      );
    }

    return {
      module: IdentityModule,
      imports,
      controllers: [IdentityController],
      providers: [
        ...persistenceProviders,
        BcryptPasswordHasher,
        {
          provide: PASSWORD_HASHER,
          useExisting: BcryptPasswordHasher,
        },
        JwtTokenService,
        {
          provide: TOKEN_SERVICE,
          useExisting: JwtTokenService,
        },
        Sha256RefreshTokenHasher,
        {
          provide: REFRESH_TOKEN_HASHER,
          useExisting: Sha256RefreshTokenHasher,
        },
        RegisterUserUseCase,
        LoginUserUseCase,
        RefreshUserUseCase,
        AdminSeeder,
        JwtAuthGuard,
        RolesGuard,
      ],
      exports: [JwtAuthGuard, RolesGuard, TOKEN_SERVICE],
    };
  }
}
