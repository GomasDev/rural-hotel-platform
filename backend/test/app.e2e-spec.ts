// backend/test/app.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // ✅ beforeAll → una sola vez (más rápido)
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get(DataSource); // ← acceso directo a DB
  });

  afterAll(async () => {
    await app.close();
  });

  // ✅ Limpia usuarios de test ANTES de cada test
  beforeEach(async () => {
    await dataSource.query(
      `DELETE FROM users WHERE email IN ('test@ruralhot.com', 'admin_test@ruralhot.com')`
    );
  });

  // ─────────────────────────────────────────────
  // TEST 1: Hello World
  // ─────────────────────────────────────────────
  it('/ (GET) → Hello World', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // ─────────────────────────────────────────────
  // TEST 2: Register
  // ─────────────────────────────────────────────
  it('/auth/register → 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client',
      })
      .expect(201);

    expect(response.body.data.email).toBe('test@ruralhot.com');
  });

  // ─────────────────────────────────────────────
  // TEST 3: Login
  // ─────────────────────────────────────────────
  it('/auth/login → 201 + token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client',
      });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@ruralhot.com', password: 'test1234' })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });

  // ─────────────────────────────────────────────
  // TEST 4: Sin token → 401
  // ─────────────────────────────────────────────
  it('/users → 401 sin token', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(401);
  });

  // ─────────────────────────────────────────────
  // TEST 5: client → 403 (guard funciona ✅)
  // ─────────────────────────────────────────────
  it('/users + JWT client → 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test',
        lastName1: 'User',
        lastName2: '',
        email: 'test@ruralhot.com',
        password: 'test1234',
        role: 'client',
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@ruralhot.com', password: 'test1234' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(403); // ← client bloqueado por RolesGuard ✅
  });

  // ─────────────────────────────────────────────
  // TEST 6: super_admin → 200 ✅
  // ─────────────────────────────────────────────
  it('/users + JWT super_admin → 200', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin',
        lastName1: 'Test',
        lastName2: '',
        email: 'admin_test@ruralhot.com',
        password: 'admin1234',
        role: 'super_admin',
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin_test@ruralhot.com', password: 'admin1234' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true); // ← devuelve array ✅
      });
  });
});
