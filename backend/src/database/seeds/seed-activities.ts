// src/database/seeds/seed-activities.ts
// npm run seed:activities

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Imágenes (Unsplash — URLs estables) ────────────────────────────────────

const IMG = {
  activities: [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', // senderismo
    'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800', // kayak
    'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800', // cultura
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // gastronomía
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', // yoga
    'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=800', // bici mtb
  ],
};

// ── Actividades (una o dos por hotel, mismo orden que hotelsData) ──────────

const activitiesData = [
  // Hotel 0 — La Posada del Valle (Cangas de Onís, Asturias)
  {
    hotelIndex: 0,
    name: 'Senderismo al Pico Mayor',
    description: 'Ruta de montaña de dificultad media con vistas panorámicas al valle del Sella.',
    category: 'adventure',
    pricePerPerson: 15.00,
    maxParticipants: 12,
    durationMinutes: 240,
    images: [IMG.activities[0]],
    isActive: true,
  },
  {
    hotelIndex: 0,
    name: 'Kayak por el río Sella',
    description: 'Descenso en kayak por aguas tranquilas del Sella. Apto para todos los niveles.',
    category: 'water',
    pricePerPerson: 25.00,
    maxParticipants: 8,
    durationMinutes: 120,
    images: [IMG.activities[1]],
    isActive: true,
  },

  // Hotel 1 — Cortijo Sierra Nevada (Güéjar Sierra, Granada)
  {
    hotelIndex: 1,
    name: 'Visita a la Alhambra con guía',
    description: 'Recorrido guiado por la Alhambra y el Generalife con traslado incluido desde el hotel.',
    category: 'culture',
    pricePerPerson: 45.00,
    maxParticipants: 15,
    durationMinutes: 300,
    images: [IMG.activities[2]],
    isActive: true,
  },
  {
    hotelIndex: 1,
    name: 'Sesión de yoga al amanecer',
    description: 'Yoga y meditación con vistas a Sierra Nevada al amanecer. Todos los niveles bienvenidos.',
    category: 'wellness',
    pricePerPerson: 12.00,
    maxParticipants: 10,
    durationMinutes: 75,
    images: [IMG.activities[4]],
    isActive: true,
  },

  // Hotel 2 — Masía Can Torrent (Sant Sadurní d'Anoia, Barcelona)
  {
    hotelIndex: 2,
    name: 'Cata de vinos del Penedès',
    description: 'Visita a la bodega de la finca con cata de 5 vinos DO Penedès y maridaje con productos locales.',
    category: 'gastronomy',
    pricePerPerson: 35.00,
    maxParticipants: 20,
    durationMinutes: 120,
    images: [IMG.activities[3]],
    isActive: true,
  },
  {
    hotelIndex: 2,
    name: 'Ruta en bicicleta entre viñedos',
    description: 'Circuito en bicicleta de montaña por los caminos rurales del Penedès. Bicicletas incluidas.',
    category: 'adventure',
    pricePerPerson: 20.00,
    maxParticipants: 10,
    durationMinutes: 180,
    images: [IMG.activities[5]],
    isActive: true,
  },

  // Hotel 3 — Hotel Rural El Molino (Fermoselle, Zamora)
  {
    hotelIndex: 3,
    name: 'Kayak por los Arribes del Duero',
    description: 'Ruta en kayak por el cañón del Duero con vistas a los acantilados de granito y Portugal al fondo.',
    category: 'water',
    pricePerPerson: 30.00,
    maxParticipants: 8,
    durationMinutes: 150,
    images: [IMG.activities[1]],
    isActive: true,
  },
  {
    hotelIndex: 3,
    name: 'Taller de cerámica tradicional',
    description: 'Aprende técnicas de cerámica artesanal con un alfarero local en su taller.',
    category: 'culture',
    pricePerPerson: 22.00,
    maxParticipants: 8,
    durationMinutes: 120,
    images: [IMG.activities[2]],
    isActive: false,
  },

  // Hotel 4 — Finca Los Olivos (Jaraíz de la Vera, Cáceres)
  {
    hotelIndex: 4,
    name: 'Taller de cocina extremeña',
    description: 'Aprende a preparar recetas típicas de La Vera con pimentón, jamón ibérico y productos de la finca.',
    category: 'gastronomy',
    pricePerPerson: 38.00,
    maxParticipants: 10,
    durationMinutes: 180,
    images: [IMG.activities[3]],
    isActive: true,
  },
  {
    hotelIndex: 4,
    name: 'Senderismo por la Garganta de los Infiernos',
    description: 'Ruta por la Reserva Natural entre cascadas y pozas de agua cristalina. Perfecta en verano.',
    category: 'adventure',
    pricePerPerson: 10.00,
    maxParticipants: 15,
    durationMinutes: 210,
    images: [IMG.activities[0]],
    isActive: true,
  },
];

// ── Seed principal ─────────────────────────────────────────────────────────

export async function runActivitiesSeed(ds: DataSource, silent = false): Promise<void> {
  const log = (msg: string) => { if (!silent) console.log(msg); };

  const hotels = await ds.query(`
    SELECT id, name FROM hotels ORDER BY created_at ASC
  `);

  if (hotels.length === 0) {
    throw new Error('❌ No hay hoteles en la BD. Ejecuta primero: npm run seed');
  }

  log(`🏨 ${hotels.length} hoteles encontrados`);

  await ds.query(`DELETE FROM activities`);
  log('🧹 Tabla activities limpiada');

  let total = 0;

  for (const a of activitiesData) {
    const hotel = hotels[a.hotelIndex];
    if (!hotel) continue;

    await ds.query(`
      INSERT INTO activities (
        hotel_id, name, description, category,
        price_per_person, max_participants, duration_minutes,
        images, is_active
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9
      )
    `, [
      hotel.id,
      a.name,
      a.description,
      a.category,
      a.pricePerPerson,
      a.maxParticipants,
      a.durationMinutes,
      a.images,
      a.isActive,
    ]);

    total++;
  }

  log(`🎯 ${total} actividades creadas`);
}

// ── Entrada CLI ────────────────────────────────────────────────────────────

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
  await runActivitiesSeed(ds);
  await ds.destroy();

  console.log('\n✅ Seed de actividades completado');
  console.log('──────────────────────────────────────────');
  console.log(`  🎯 ${activitiesData.length} actividades`);
  console.log('──────────────────────────────────────────');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error en seed de actividades:', err.message);
    process.exit(1);
  });
}