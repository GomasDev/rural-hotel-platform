// src/database/seeds/seed.ts

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import type { UserRole } from '../types';
dotenv.config();

// ── Imágenes ───────────────────────────────────────────────────────────────

const IMG = {
  hotels: [
    // La Posada del Valle — Asturias
    [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    ],
    // Cortijo Sierra Nevada — Granada
    [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    ],
    // Masía Can Torrent — Barcelona
    [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800',
      'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
    ],
    // Hotel Rural El Molino — Zamora
    [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
      'https://images.unsplash.com/photo-1605346576626-c1a2f507e689?w=800',
    ],
    // Finca Los Olivos — Cáceres
    [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    ],
  ],
  rooms: [
    // Habitaciones individuales / dobles
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
    // Suites
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
    // Habitaciones familiares
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800',
  ],
};

// ── Datos ──────────────────────────────────────────────────────────────────

const usersData: {
  name: string;
  lastName1: string;
  lastName2: string;
  email: string;
  password: string;
  role: UserRole;
}[] = [
  { name: 'Carlos',  lastName1: 'García',    lastName2: 'López',   email: 'superadmin@ruralhot.com', password: 'SuperAdmin123!', role: 'super_admin' },
  { name: 'María',   lastName1: 'Fernández', lastName2: 'Ruiz',    email: 'admin@ruralhot.com',      password: 'Admin123!',      role: 'admin' },
  { name: 'Pedro',   lastName1: 'Martínez',  lastName2: 'Sánchez', email: 'client@ruralhot.com',     password: 'Client123!',     role: 'client' },
  { name: 'Laura',   lastName1: 'Gómez',     lastName2: 'Torres',  email: 'client2@ruralhot.com',    password: 'Client123!',     role: 'client' },
];

const hotelsData = [
  {
    name: 'La Posada del Valle',
    description: 'Encantadora posada en el corazón de los Picos de Europa.',
    address: 'Ctra. del Valle, 12, Cangas de Onís, Asturias',
    lng: -5.1295, lat: 43.3518,
    phone: '985123456', email: 'info@posadadelvalle.es',
    images: IMG.hotels[0],
    rooms: [
      { name: 'Habitación Doble Valle', capacity: 2, price: 95.00,  images: [IMG.rooms[0], IMG.rooms[1]] },
      { name: 'Suite Montaña',          capacity: 4, price: 155.00, images: [IMG.rooms[3], IMG.rooms[4]] },
      { name: 'Habitación Individual',  capacity: 1, price: 65.00,  images: [IMG.rooms[2]] },
    ],
  },
  {
    name: 'Cortijo Sierra Nevada',
    description: 'Cortijo andaluz restaurado con vistas a Sierra Nevada.',
    address: 'Camino de la Sierra, s/n, Güéjar Sierra, Granada',
    lng: -3.4512, lat: 37.1543,
    phone: '958654321', email: 'reservas@cortijosierranevada.es',
    images: IMG.hotels[1],
    rooms: [
      { name: 'Suite Sierra',        capacity: 2, price: 120.00, images: [IMG.rooms[3], IMG.rooms[4]] },
      { name: 'Habitación Familiar', capacity: 4, price: 140.00, images: [IMG.rooms[5], IMG.rooms[6]] },
    ],
  },
  {
    name: 'Masía Can Torrent',
    description: 'Masía catalana del siglo XVIII con piscina y viñedos.',
    address: "Camí de Can Torrent, 8, Sant Sadurní d'Anoia, Barcelona",
    lng: 1.7885, lat: 41.4231,
    phone: '938911234', email: 'hola@masiacantorrent.cat',
    images: IMG.hotels[2],
    rooms: [
      { name: 'Habitación Viñedo',        capacity: 2, price: 110.00, images: [IMG.rooms[0], IMG.rooms[2]] },
      { name: 'Suite Masía',              capacity: 2, price: 175.00, images: [IMG.rooms[3], IMG.rooms[4]] },
      { name: 'Habitación Doble Classic', capacity: 2, price: 85.00,  images: [IMG.rooms[1]] },
    ],
  },
  {
    name: 'Hotel Rural El Molino',
    description: 'Antiguo molino a orillas del río Duero.',
    address: 'Paraje El Molino, s/n, Fermoselle, Zamora',
    lng: -6.3978, lat: 41.3201,
    phone: '980567890', email: 'elmolino@ruralhot.com',
    images: IMG.hotels[3],
    rooms: [
      { name: 'Habitación Río',  capacity: 2, price: 80.00,  images: [IMG.rooms[1], IMG.rooms[2]] },
      { name: 'Suite El Molino', capacity: 3, price: 130.00, images: [IMG.rooms[3], IMG.rooms[4]] },
    ],
  },
  {
    name: 'Finca Los Olivos',
    description: 'Finca extremeña con olivar centenario.',
    address: 'Carretera EX-386, km 4, Jaraíz de la Vera, Cáceres',
    lng: -5.7512, lat: 40.0634,
    phone: '927112233', email: 'finca@losolivos.es',
    images: IMG.hotels[4],
    rooms: [
      { name: 'Habitación Olivar',     capacity: 2, price: 75.00,  images: [IMG.rooms[0], IMG.rooms[2]] },
      { name: 'Suite Finca',           capacity: 4, price: 145.00, images: [IMG.rooms[3], IMG.rooms[4]] },
      { name: 'Habitación Individual', capacity: 1, price: 55.00,  images: [IMG.rooms[1]] },
    ],
  },
];

// ── Función reutilizable (tests + CLI) ─────────────────────────────────────

export async function runSeed(ds: DataSource, silent = false): Promise<void> {
  const log = (msg: string) => { if (!silent) console.log(msg); };

  await ds.query(`DELETE FROM rooms`);
  await ds.query(`DELETE FROM hotels`);
  await ds.query(`
    DELETE FROM users
    WHERE email NOT IN (
      'test@ruralhot.com',
      'admin_test@ruralhot.com',
      'admin_hotel@test.com',
      'client_hotel@test.com',
      'reset-test@ruralhot.com',
      'superadmin_e2e@ruralhot.com',
      'client_e2e@ruralhot.com'
    )
  `);
  log('🧹 Tablas limpiadas');

  const createdUsers: { id: string; email: string; role: string }[] = [];

  for (const u of usersData) {
    const hash = await bcrypt.hash(u.password, 10);

    const inserted = await ds.query(`
      INSERT INTO users (name, last_name1, last_name2, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `, [u.name, u.lastName1, u.lastName2, u.email, hash, u.role]);

    if (inserted[0]) {
      createdUsers.push(inserted[0]);
    } else {
      const existing = await ds.query(
        `SELECT id, email, role FROM users WHERE email = $1`, [u.email],
      );
      if (existing[0]) createdUsers.push(existing[0]);
    }
  }

  log(`👥 ${createdUsers.length} usuarios listos`);

  const ownerId = createdUsers.find(u => u.role === 'super_admin')?.id;
  if (!ownerId) throw new Error('No se pudo obtener el super_admin');

  let totalRooms = 0;

  for (const h of hotelsData) {
    const hotelResult = await ds.query(`
      INSERT INTO hotels (owner_id, name, description, address, location, phone, email, images, is_active)
      VALUES (
        $1, $2, $3, $4,
        ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, true
      )
      RETURNING id
    `, [ownerId, h.name, h.description, h.address, h.lng, h.lat, h.phone, h.email, h.images]);

    const hotelId = hotelResult[0].id;

    for (const room of h.rooms) {
      await ds.query(`
        INSERT INTO rooms (hotel_id, name, description, capacity, price_per_night, images, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [hotelId, room.name, `${room.name} — ${h.name}`, room.capacity, room.price, room.images]);
      totalRooms++;
    }
  }

  log(`🏨 ${hotelsData.length} hoteles y 🛏️  ${totalRooms} habitaciones creadas`);
}

// ── Entrada CLI (npm run seed) ─────────────────────────────────────────────

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'ruralhot',
    password: process.env.DB_PASSWORD || 'ruralhot',
    database: process.env.DB_NAME     || 'ruralhot',
    ssl: false,
    synchronize: false,
  });

  await ds.initialize();
  await runSeed(ds);
  await ds.destroy();

  console.log('\n✅ Seed completado');
  console.log('─────────────────────────────────────────');
  console.log('  super_admin → superadmin@ruralhot.com  /  SuperAdmin123!');
  console.log('  admin       → admin@ruralhot.com       /  Admin123!');
  console.log('  client      → client@ruralhot.com      /  Client123!');
  console.log('─────────────────────────────────────────');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  });
}