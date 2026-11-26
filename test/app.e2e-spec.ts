import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  afterEach(async () => {
    await app.close();
  });
});
