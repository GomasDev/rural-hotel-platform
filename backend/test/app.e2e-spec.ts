// backend/test/app.e2e-spec.ts ← CAMBIA nombre describe
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    //Limpia test user (si existe)
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@ruralhot.com', password: 'test123' })
      .catch(() => {}); // Ignora error si no existe
    await app.close();
  });

  // TU TEST ORIGINAL
  it('/ (GET) → Hello World', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // NUEVOS TESTS AUTH
  it('/auth/register → 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client'
      })
      .expect(201);

    expect(response.body.data.email).toBe('test@ruralhot.com');
  });

  it('/auth/login → 201 + token', async () => {
    // Prepara el usuario que se va a autenticar
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client'
      });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@ruralhot.com',
        password: 'test1234'
      })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });

  it('/users → 401 protegido', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(401);
  });

  it('/users + JWT → 200 con test@ruralhot.com', async () => {
    // Asegura que el usuario exista
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client'
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@ruralhot.com', password: 'test1234' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ email: 'test@ruralhot.com' }),
          ]),
        );
      });
  });
});
