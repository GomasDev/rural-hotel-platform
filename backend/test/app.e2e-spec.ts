// backend/test/app.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { createConnection } from 'net';

// Helper to wait for DB
async function waitForDatabase(host: string, port: number, retries = 20): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const client = createConnection({ host, port }, () => {
          client.end();
          resolve(void 0);
        });
        client.on('error', reject);
        setTimeout(() => {
          client.destroy();
          reject(new Error('Timeout'));
        }, 1000);
      });
      return;
    } catch (error) {
      // Ignore
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Database not ready');
}

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // ✅ beforeAll → una sola vez (más rápido)
  beforeAll(async () => {
    // Wait for DB to be ready
    await waitForDatabase('db', 5432);

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
        password: 'Test1234.',
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
        password: 'Test1234.',
        role: 'client',
      });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@ruralhot.com', password: 'Test1234.' })
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
        password: 'Test1234.',
        role: 'client',
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@ruralhot.com', password: 'Test1234.' })
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
        password: 'Admin1234.',
        role: 'super_admin',
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin_test@ruralhot.com', password: 'Admin1234.' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true); // ← devuelve array ✅
      });
  });

  // ─────────────────────────────────────────────
// TEST 7: Forgot Password → Email OK (sin Mailpit)
// ─────────────────────────────────────────────
it('/auth/forgot-password → 201 (no revela si existe)', async () => {
  // Registra usuario primero
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      name: 'Test',
      lastName1: 'Reset',
      lastName2: '',
      email: 'test@ruralhot.com',
      password: 'Test1234.',
      role: 'client',
    });

  // Forgot password → debe responder OK aunque NO chequee Mailpit
  const response = await request(app.getHttpServer())
    .post('/auth/forgot-password')
    .send({ email: 'test@ruralhot.com' })
    .expect(201);

  expect(response.body.message).toContain('enviado');
});

// ─────────────────────────────────────────────
// TEST 8: Reset Password → Token inválido → 400
// ─────────────────────────────────────────────
it('/auth/reset-password → 400 token inválido', () => {
  return request(app.getHttpServer())
    .post('/auth/reset-password')
    .send({ 
      token: 'token-falso-123', 
      newPassword: 'NewPass123!'  
    })
    .expect(400)
    .expect(res => {
      expect(res.body.message).toContain('Token inválido');
    });
});

// ─────────────────────────────────────────────
// TEST 9: Flujo completo Register → Forgot → Reset → Login
// ─────────────────────────────────────────────
it('Register → Forgot → Reset → Login exitoso', async () => {
  const email = 'reset-test@ruralhot.com';
  const oldPass = 'Old1234.';
  const newPass = 'New1234.';

  // 1. Register
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      name: 'Reset',
      lastName1: 'Test',
      lastName2: '',
      email: email,
      password: oldPass,
      role: 'client',
    });

  // 2. Forgot password (genera token en DB)
  await request(app.getHttpServer())
    .post('/auth/forgot-password')
    .send({ email: email });

  //Extrae token directo de DB para test
  const tokenResult = await dataSource.query(
    `SELECT reset_password_token FROM users WHERE email = $1`,
    [email]
  );
  const token = tokenResult[0]?.reset_password_token;
  expect(token).toBeTruthy();

  // 4. Reset con token real
  await request(app.getHttpServer())
    .post('/auth/reset-password')
    .send({ token, newPassword: newPass })
    .expect(201);

  // 5. Login con NUEVA contraseña ✅
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: newPass })
    .expect(201);

  expect(login.body).toHaveProperty('access_token');
});
});
