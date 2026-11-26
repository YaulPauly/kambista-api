import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CurrencyPair } from './../src/currencies/domain/value-objects/currency-pair.value-object';
import { ExchangeRate } from './../src/exchange-rates/domain/entities/exchange-rate.entity';
import {
  EXCHANGE_RATE_REPOSITORY,
  ExchangeRateRepository,
} from './../src/exchange-rates/application/ports/exchange-rate-repository.port';
import { AppModule } from './../src/app.module';
import {
  TOKEN_SERVICE,
  TokenService,
} from './../src/identity/application/ports/token-service.port';
import { UserRole } from './../src/identity/domain/enums/user-role.enum';
import { setupSwagger } from './../src/platform/http/swagger';

interface UserResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface RegisterResponse {
  usuario: UserResponse;
}

interface LoginResponse {
  access_token: string;
  usuario: UserResponse;
}

interface TransactionResponse {
  id: string;
  monedaOrigen: string;
  monedaDestino: string;
  monto: number;
  montoCambiado: number;
  tipoCambio: number;
  fecha: string;
}

interface OpenApiResponse {
  info: {
    title: string;
  };
  paths: Record<string, unknown>;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    setupSwagger(app);
    await app.init();

    const exchangeRateRepository = app.get<ExchangeRateRepository>(
      EXCHANGE_RATE_REPOSITORY,
      { strict: false },
    );
    await exchangeRateRepository.save(
      ExchangeRate.create({
        id: 'test-exchange-rate',
        pair: CurrencyPair.create('USD', 'PEN'),
        purchaseRate: 3.49,
        saleRate: 3.739,
        source: 'SUNAT',
        effectiveDate: new Date('2026-11-26T05:00:00.000Z'),
        fetchedAt: new Date(),
      }),
    );
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers and logs in a user', async () => {
    const registration = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'contraseña123',
      })
      .expect(201);
    const registrationBody = registration.body as unknown as RegisterResponse;

    expect(registrationBody).toMatchObject({
      usuario: {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user',
      },
    });
    expect(typeof registrationBody.usuario.id).toBe('string');
    expect(registrationBody.usuario).not.toHaveProperty('password');

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'JUAN@example.com',
        password: 'contraseña123',
      })
      .expect(409);

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'JUAN@example.com',
        password: 'contraseña123',
      })
      .expect(200);
    const loginBody = login.body as unknown as LoginResponse;

    expect(loginBody).toMatchObject({
      usuario: {
        id: registrationBody.usuario.id,
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user',
      },
    });
    expect(typeof loginBody.access_token).toBe('string');
    expect(loginBody.usuario).not.toHaveProperty('password');
  });

  it('rejects invalid registration data and unexpected properties', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'invalid-email',
        password: 'short',
        rol: 'admin',
      })
      .expect(400);
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'Contraseña123',
      })
      .expect(401);
  });

  it('exposes the OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const responseBody = response.body as unknown as OpenApiResponse;

    expect(responseBody).toMatchObject({
      info: {
        title: 'Kambista API',
      },
    });
    expect(responseBody.paths).toHaveProperty('/v1/auth/register');
    expect(responseBody.paths).toHaveProperty('/v1/auth/login');
    expect(responseBody.paths).toHaveProperty('/v1/transactions');
    expect(responseBody.paths).toHaveProperty('/v1/transactions/history');
  });

  it('requires authentication for transaction endpoints', async () => {
    await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        monedaOrigen: 'USD',
        monedaDestino: 'PEN',
        monto: 100,
      })
      .expect(401);

    await request(app.getHttpServer())
      .get('/v1/transactions/history')
      .query({ startDate: '2026-11-01', endDate: '2026-11-30' })
      .expect(401);
  });

  it('creates transactions in both directions and returns the user history', async () => {
    const session = await registerAndLogin('transaction@example.com');

    const directTransaction = await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        monedaOrigen: 'USD',
        monedaDestino: 'PEN',
        monto: 100,
      })
      .expect(201);
    const directBody = directTransaction.body as TransactionResponse;

    expect(directBody).toMatchObject({
      monedaOrigen: 'USD',
      monedaDestino: 'PEN',
      monto: 100,
      montoCambiado: 373.9,
      tipoCambio: 3.739,
    });

    const inverseTransaction = await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        monedaOrigen: 'PEN',
        monedaDestino: 'USD',
        monto: 100,
      })
      .expect(201);
    const inverseBody = inverseTransaction.body as TransactionResponse;

    expect(inverseBody).toMatchObject({
      monedaOrigen: 'PEN',
      monedaDestino: 'USD',
      monto: 100,
      montoCambiado: 28.65,
      tipoCambio: 3.49,
    });

    const history = await request(app.getHttpServer())
      .get('/v1/transactions/history')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .query({ startDate: '2026-11-01', endDate: '2030-11-30' })
      .expect(200);

    expect(history.body).toHaveLength(2);
  });

  it('allows an admin to query another user history', async () => {
    const session = await registerAndLogin('history-user@example.com');

    await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        monedaOrigen: 'USD',
        monedaDestino: 'PEN',
        monto: 50,
      })
      .expect(201);

    const tokenService = app.get<TokenService>(TOKEN_SERVICE, {
      strict: false,
    });
    const adminToken = await tokenService.sign({
      sub: 'admin-test-id',
      name: 'Test Administrator',
      email: 'admin-test@example.com',
      role: UserRole.ADMIN,
    });

    const history = await request(app.getHttpServer())
      .get('/v1/transactions/history')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        startDate: '2026-11-01',
        endDate: '2030-11-30',
        userId: session.userId,
      })
      .expect(200);

    expect(history.body).toHaveLength(1);
    expect((history.body as TransactionResponse[])[0]?.monto).toBe(50);
  });

  it('rejects invalid transaction data', async () => {
    const session = await registerAndLogin('invalid-transaction@example.com');

    await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        monedaOrigen: 'USD',
        monedaDestino: 'USD',
        monto: 100.123,
      })
      .expect(400);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  async function registerAndLogin(email: string): Promise<{
    userId: string;
    accessToken: string;
  }> {
    const registration = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        nombre: 'Transaction User',
        email,
        password: 'Contraseña123',
      })
      .expect(201);
    const registrationBody = registration.body as unknown as RegisterResponse;

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'Contraseña123' })
      .expect(200);
    const loginBody = login.body as unknown as LoginResponse;

    return {
      userId: registrationBody.usuario.id,
      accessToken: loginBody.access_token,
    };
  }
});
