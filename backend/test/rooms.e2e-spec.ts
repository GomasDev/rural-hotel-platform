import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

describe('Rooms & Bookings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let clientToken: string;
  let adminId: string;
  let hotelId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // --- SETUP INICIAL DE USUARIOS ---
    await dataSource.query(`DELETE FROM users WHERE email IN ('admin_rooms@test.com', 'client_rooms@test.com')`);

    // Crear Admin y obtener Token
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin', lastName1: 'Rooms', email: 'admin_rooms@test.com', 
      password: 'Admin1234.', role: 'super_admin'
    });
    const adminLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'admin_rooms@test.com', password: 'Admin1234.' });
    adminToken = adminLogin.body.access_token;
    
    const adminUser = await dataSource.query(`SELECT id FROM users WHERE email = 'admin_rooms@test.com'`);
    adminId = adminUser[0].id;

    // Crear Cliente y obtener Token
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Client', lastName1: 'Rooms', email: 'client_rooms@test.com', 
      password: 'Client1234.', role: 'client'
    });
    const clientLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'client_rooms@test.com', password: 'Client1234.' });
    clientToken = clientLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Limpieza en orden para evitar errores de FK
    await dataSource.query(`DELETE FROM bookings`);
    await dataSource.query(`DELETE FROM rooms`);
    await dataSource.query(`DELETE FROM hotels`);

    // Crear hotel base para los tests de este archivo
    const hotelRes = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hotel Room Test',
        ownerId: adminId,
        address: 'Test Address',
        location: '-3.0,40.0',
      })
      .expect(201);
    hotelId = hotelRes.body.id;
  });

  // --- TESTS DE DISPONIBILIDAD (S2-05) ---
  describe('Disponibilidad y Precios', () => {
    it('GET /rooms/available → calcula precio total por estancia', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          hotelId, name: 'Habitación Doble', capacity: 2, 
          pricePerNight: 75, isAvailable: true 
        });

      const res = await request(app.getHttpServer())
        .get(`/rooms/available?hotelId=${hotelId}&checkIn=2026-06-01&checkOut=2026-06-04`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      // 3 noches * 75 = 225
      expect(res.body[0]).toHaveProperty('totalPrice', 225);
    });
  });

  // --- TESTS DE ESTADOS (S2-06) ---
  describe('Gestión de Reservas', () => {
    it('PATCH /status → libera habitación al cancelar', async () => {
      // 1. Crear habitación ocupada
      const room = await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hotelId, name: 'Room 202', capacity: 2, pricePerNight: 100, isAvailable: false });

      // 2. Insertar reserva pendiente
      const resDb = await dataSource.query(
        `INSERT INTO bookings (id, user_id, room_id, check_in, check_out, total_price, status, guests) 
         VALUES (gen_random_uuid(), $1, $2, '2026-07-01', '2026-07-02', 100, 'pending', 2) RETURNING id`,
        [adminId, room.body.id]
      );

      // 3. Cancelar
      await request(app.getHttpServer())
        .patch(`/rooms/bookings/${resDb[0].id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' })
        .expect(200);

      // 4. Verificar liberación
      const check = await dataSource.query(`SELECT is_available FROM rooms WHERE id = $1`, [room.body.id]);
      expect(check[0].is_available).toBe(true);
    });

    it('Seguridad → cliente no puede cambiar estado', async () => {
       // Simular intento de hackeo de estado por un cliente
       await request(app.getHttpServer())
        .patch(`/rooms/bookings/algun-uuid/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'confirmed' })
        .expect(403);
    });
  });
});