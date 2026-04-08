// backend/test/app.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { runSeed } from '../src/database/seeds/seed';
import { createConnection } from 'net';

// ── Helper: esperar a que la DB esté lista ─────────────────────────────────
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
    } catch {
      // reintento
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Database not ready');
}

// ── Emails efímeros (se limpian entre cada test) ───────────────────────────
const EPHEMERAL_EMAILS = [
  'test@ruralhot.com',
  'admin_test@ruralhot.com',
  'reset-test@ruralhot.com',
];

// ── Emails persistentes (duran toda la suite, se limpian en afterAll) ─────
const PERSISTENT_EMAILS = [
  'superadmin_e2e@ruralhot.com',
  'client_e2e@ruralhot.com',
];

// ──────────────────────────────────────────────────────────────────────────
describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    await waitForDatabase('db', 5432);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Limpia residuos de ejecuciones anteriores
    await dataSource.query(
      `DELETE FROM users WHERE email = ANY($1::text[])`,
      [[...EPHEMERAL_EMAILS, ...PERSISTENT_EMAILS]]
    );
  });

  // ✅ Al terminar: limpia los de test y relanza el seed → DB queda limpia
  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM users WHERE email = ANY($1::text[])`,
      [[...EPHEMERAL_EMAILS, ...PERSISTENT_EMAILS]]
    );

    await runSeed(dataSource, true);

    await app.close();
  });

  // ✅ Entre cada test solo borra los efímeros — los persistentes sobreviven
  beforeEach(async () => {
    await dataSource.query(
      `DELETE FROM users WHERE email = ANY($1::text[])`,
      [EPHEMERAL_EMAILS]
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
  // TEST 5: client → 403
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
      .expect(403);
  });

  // ─────────────────────────────────────────────
  // TEST 6: super_admin → 200
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
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  // ─────────────────────────────────────────────
  // TEST 7: Forgot Password
  // ─────────────────────────────────────────────
  it('/auth/forgot-password → 201 (no revela si existe)', async () => {
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

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'test@ruralhot.com' })
      .expect(201);

    expect(response.body.message).toContain('enviado');
  });

  // ─────────────────────────────────────────────
  // TEST 8: Reset Password → token inválido → 400
  // ─────────────────────────────────────────────
  it('/auth/reset-password → 400 token inválido', () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'token-falso-123', newPassword: 'NewPass123!' })
      .expect(400)
      .expect(res => {
        expect(res.body.message).toContain('Token inválido');
      });
  });

  // ─────────────────────────────────────────────
  // TEST 9: Register → Forgot → Reset → Login
  // ─────────────────────────────────────────────
  it('Register → Forgot → Reset → Login exitoso', async () => {
    const email = 'reset-test@ruralhot.com';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Reset',
        lastName1: 'Test',
        lastName2: '',
        email,
        password: 'Old1234.',
        role: 'client',
      });

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email });

    const tokenResult = await dataSource.query(
      `SELECT reset_password_token FROM users WHERE email = $1`, [email]
    );
    const token = tokenResult[0]?.reset_password_token;
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token, newPassword: 'New1234.' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'New1234.' })
      .expect(201);

    expect(login.body).toHaveProperty('access_token');
  });

  // ─────────────────────────────────────────────
  // HOTELES & HABITACIONES (RBAC & Relaciones)
  // ─────────────────────────────────────────────
  let adminToken: string;
  let clientToken: string;
  let createdHotelId: string;

  // ✅ Crea usuarios persistentes para los tests de negocio
  beforeAll(async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'SuperAdmin',
        lastName1: 'E2E',
        lastName2: '',
        email: 'superadmin_e2e@ruralhot.com',
        password: 'SuperAdmin123!',
        role: 'super_admin',
      });

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin_e2e@ruralhot.com', password: 'SuperAdmin123!' });
    adminToken = loginAdmin.body.access_token;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Client',
        lastName1: 'E2E',
        lastName2: '',
        email: 'client_e2e@ruralhot.com',
        password: 'Client123!',
        role: 'client',
      });

    const loginClient = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'client_e2e@ruralhot.com', password: 'Client123!' });
    clientToken = loginClient.body.access_token;
  });

  it('POST /hotels → 403 Forbidden si el usuario es "client"', () => {
    return request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        name: 'Hotel Prohibido',
        address: 'Calle Falsa 123',
        location: '0,0',
        phone: '123',
        email: 'bad@hotel.com',
      })
      .expect(403);
  });

  it('POST /hotels → 201 Created si el usuario es "super_admin"', async () => {
    const response = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Gran Hotel Test',
        description: 'Descripción de prueba',
        address: 'Sierra Norte, Madrid',
        location: '40.41, -3.70',
        phone: '911223344',
        email: 'granhotel@test.com',
        images: [],
        isActive: true,
      })
      .expect(201);

    createdHotelId = response.body.id;
    expect(createdHotelId).toBeDefined();
  });

  it('POST /rooms → 201 Created vinculado al hotel anterior', async () => {
    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hotelId: createdHotelId,
        name: 'Habitación Suite 101',
        description: 'Suite de lujo para tests',
        capacity: 2,
        pricePerNight: 150.00,
        images: [],
        isAvailable: true,
      })
      .expect(201);

    expect(response.body.hotelId).toBe(createdHotelId);
  });

  it('DELETE /hotels/:id → Borrado en cascada de habitaciones', async () => {
    await request(app.getHttpServer())
      .delete(`/hotels/${createdHotelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const roomCount = await dataSource.query(
      `SELECT COUNT(*) FROM rooms WHERE hotel_id = $1`,
      [createdHotelId]
    );
    expect(parseInt(roomCount[0].count)).toBe(0);
  });
});