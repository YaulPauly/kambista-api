import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
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
  });

  afterEach(async () => {
    await app.close();
  });
});
