// src/database/seeds/seed-tourism.ts
// npm run seed:tourism

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Imágenes (Unsplash — URLs estables) ────────────────────────────────────

const IMG = {
  restaurants: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1550966871-3ed3cfd082da?w=800',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
  ],
  hiking: [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=800',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800',
  ],
};

// ── Restaurantes (uno o dos por hotel, mismo orden que hotelsData) ─────────

const restaurantsData = [
  // Hotel 1 — La Posada del Valle (Cangas de Onís, Asturias)
  {
    hotelIndex: 0,
    name: 'El Fogón Asturiano',
    description: 'Cocina tradicional asturiana con fabadas, cachopo y sidra natural de barril.',
    lng: -5.1301, lat: 43.3522,
    phone: '985123400',
    website: 'https://elfogonasturiano.es',
    cuisineType: 'Cocina asturiana',
    priceRange: '€€',
    rating: 4.7,
    images: [IMG.restaurants[0], IMG.restaurants[1]],
  },
  {
    hotelIndex: 0,
    name: 'Bar La Fuente',
    description: 'Bar de tapas junto al río Sella. Bocadillos y raciones caseras.',
    lng: -5.1280, lat: 43.3510,
    phone: '985123411',
    website: null,
    cuisineType: 'Tapas y raciones',
    priceRange: '€',
    rating: 4.2,
    images: [IMG.restaurants[2]],
  },

  // Hotel 2 — Cortijo Sierra Nevada (Güéjar Sierra, Granada)
  {
    hotelIndex: 1,
    name: 'Mesón La Solana',
    description: 'Gastronomía granadina de altura: carnes a la brasa y berenjenas con miel.',
    lng: -3.4520, lat: 37.1550,
    phone: '958654300',
    website: 'https://mesonlasolana.com',
    cuisineType: 'Cocina andaluza',
    priceRange: '€€',
    rating: 4.6,
    images: [IMG.restaurants[1], IMG.restaurants[3]],
  },

  // Hotel 3 — Masía Can Torrent (Sant Sadurní d'Anoia, Barcelona)
  {
    hotelIndex: 2,
    name: 'Restaurant Can Torrent',
    description: 'Cocina catalana de temporada con productos del huerto propio y vinos de la finca.',
    lng: 1.7890, lat: 41.4235,
    phone: '938911200',
    website: 'https://masiacantorrent.cat/restaurant',
    cuisineType: 'Cocina catalana',
    priceRange: '€€€',
    rating: 4.9,
    images: [IMG.restaurants[0], IMG.restaurants[4]],
  },
  {
    hotelIndex: 2,
    name: 'La Bodega del Penedès',
    description: 'Bar de vinos con tabla de embutidos ibéricos y quesos artesanos del Penedès.',
    lng: 1.7870, lat: 41.4220,
    phone: '938911201',
    website: null,
    cuisineType: 'Vinos y tapas',
    priceRange: '€€',
    rating: 4.5,
    images: [IMG.restaurants[2]],
  },

  // Hotel 4 — Hotel Rural El Molino (Fermoselle, Zamora)
  {
    hotelIndex: 3,
    name: 'Asador El Duero',
    description: 'Lechazo y cochinillo asados en horno de leña con vistas al río Duero.',
    lng: -6.3985, lat: 41.3208,
    phone: '980567800',
    website: 'https://asadorelduero.es',
    cuisineType: 'Asador castellano',
    priceRange: '€€',
    rating: 4.8,
    images: [IMG.restaurants[3], IMG.restaurants[0]],
  },

  // Hotel 5 — Finca Los Olivos (Jaraíz de la Vera, Cáceres)
  {
    hotelIndex: 4,
    name: 'Taberna La Vera',
    description: 'Cocina extremeña con pimentón de La Vera, jamón ibérico y migas de pastor.',
    lng: -5.7520, lat: 40.0640,
    phone: '927112200',
    website: null,
    cuisineType: 'Cocina extremeña',
    priceRange: '€€',
    rating: 4.4,
    images: [IMG.restaurants[1], IMG.restaurants[4]],
  },
  {
    hotelIndex: 4,
    name: 'El Rincón del Olivar',
    description: 'Desayunos y brunchs con aceite de oliva virgen extra de la propia finca.',
    lng: -5.7505, lat: 40.0630,
    phone: '927112211',
    website: 'https://losolivos.es/rincon',
    cuisineType: 'Brunch y desayunos',
    priceRange: '€',
    rating: 4.3,
    images: [IMG.restaurants[2]],
  },
];

// ── Rutas de senderismo ────────────────────────────────────────────────────
// route_geom: WKT LineString (lng lat, lng lat, ...)

const hikingRoutesData = [
  // Hotel 1 — Asturias / Picos de Europa
  {
    hotelIndex: 0,
    name: 'Ruta del Cares — Desfiladero de la Hermida',
    description: 'Espectacular camino excavado en la roca sobre el río Cares. Una de las rutas más famosas de Europa.',
    difficulty: 'medium',
    distanceKm: 12.0,
    elevationGainM: 320,
    durationMinutes: 240,
    gpxFileUrl: null,
    images: [IMG.hiking[0], IMG.hiking[1]],
    routeGeom: `LINESTRING(
      -4.9200 43.2600,
      -4.9100 43.2620,
      -4.9000 43.2650,
      -4.8900 43.2680,
      -4.8800 43.2700,
      -4.8700 43.2720
    )`,
  },
  {
    hotelIndex: 0,
    name: 'Mirador del Fito',
    description: 'Sencillo paseo entre bosques de eucalipto con vistas panorámicas al mar Cantábrico y los Picos.',
    difficulty: 'low',
    distanceKm: 5.5,
    elevationGainM: 180,
    durationMinutes: 100,
    gpxFileUrl: null,
    images: [IMG.hiking[2]],
    routeGeom: `LINESTRING(
      -5.1200 43.3400,
      -5.1100 43.3430,
      -5.1000 43.3460,
      -5.0900 43.3490
    )`,
  },

  // Hotel 2 — Sierra Nevada / Granada
  {
    hotelIndex: 1,
    name: 'Ascenso al Veleta',
    description: 'Ruta de alta montaña hacia el segundo pico más alto de la Península. Requiere buena condición física.',
    difficulty: 'high',
    distanceKm: 18.5,
    elevationGainM: 1420,
    durationMinutes: 420,
    gpxFileUrl: null,
    images: [IMG.hiking[3], IMG.hiking[4]],
    routeGeom: `LINESTRING(
      -3.4512 37.1543,
      -3.4400 37.1700,
      -3.4300 37.1900,
      -3.4200 37.2100,
      -3.4150 37.2300,
      -3.4000 37.2500
    )`,
  },
  {
    hotelIndex: 1,
    name: 'Laguna de las Yeguas',
    description: 'Paseo por los lagos glaciares de Sierra Nevada rodeado de flora protegida.',
    difficulty: 'medium',
    distanceKm: 9.2,
    elevationGainM: 580,
    durationMinutes: 180,
    gpxFileUrl: null,
    images: [IMG.hiking[0]],
    routeGeom: `LINESTRING(
      -3.4512 37.1543,
      -3.4450 37.1650,
      -3.4380 37.1780,
      -3.4300 37.1900
    )`,
  },

  // Hotel 3 — Penedès / Barcelona
  {
    hotelIndex: 2,
    name: 'Ruta entre Viñedos del Penedès',
    description: 'Paseo circular entre bodegas y viñedos con posibilidad de cata al final del recorrido.',
    difficulty: 'low',
    distanceKm: 7.0,
    elevationGainM: 120,
    durationMinutes: 120,
    gpxFileUrl: null,
    images: [IMG.hiking[1], IMG.hiking[2]],
    routeGeom: `LINESTRING(
      1.7885 41.4231,
      1.7950 41.4260,
      1.8020 41.4290,
      1.8100 41.4310,
      1.8050 41.4270,
      1.7980 41.4250,
      1.7885 41.4231
    )`,
  },

  // Hotel 4 — Arribes del Duero / Zamora
  {
    hotelIndex: 3,
    name: 'Mirador de los Arribes',
    description: 'Impresionante ruta por el cañón del Duero con vistas a Portugal. Buitres leonados sobrevolando el cañón.',
    difficulty: 'medium',
    distanceKm: 11.0,
    elevationGainM: 400,
    durationMinutes: 210,
    gpxFileUrl: null,
    images: [IMG.hiking[3]],
    routeGeom: `LINESTRING(
      -6.3978 41.3201,
      -6.4050 41.3150,
      -6.4120 41.3100,
      -6.4200 41.3050,
      -6.4280 41.3000
    )`,
  },
  {
    hotelIndex: 3,
    name: 'Sendero del Río Tormes',
    description: 'Ruta fluvial fácil a lo largo de las orillas del río Tormes. Ideal para familias.',
    difficulty: 'low',
    distanceKm: 6.0,
    elevationGainM: 60,
    durationMinutes: 90,
    gpxFileUrl: null,
    images: [IMG.hiking[2], IMG.hiking[4]],
    routeGeom: `LINESTRING(
      -6.3978 41.3201,
      -6.3900 41.3220,
      -6.3820 41.3240,
      -6.3740 41.3260
    )`,
  },

  // Hotel 5 — La Vera / Cáceres
  {
    hotelIndex: 4,
    name: 'Garganta de los Infiernos',
    description: 'Ruta por la Reserva Natural entre cascadas y pozas de agua cristalina. Refrescante en verano.',
    difficulty: 'medium',
    distanceKm: 8.5,
    elevationGainM: 350,
    durationMinutes: 180,
    gpxFileUrl: null,
    images: [IMG.hiking[0], IMG.hiking[3]],
    routeGeom: `LINESTRING(
      -5.7512 40.0634,
      -5.7420 40.0700,
      -5.7330 40.0770,
      -5.7240 40.0840,
      -5.7160 40.0910
    )`,
  },
  {
    hotelIndex: 4,
    name: 'Ruta del Pimentón',
    description: 'Paseo cultural por los secaderos de pimentón de La Vera, Patrimonio Gastronómico de Extremadura.',
    difficulty: 'low',
    distanceKm: 4.5,
    elevationGainM: 80,
    durationMinutes: 75,
    gpxFileUrl: null,
    images: [IMG.hiking[1]],
    routeGeom: `LINESTRING(
      -5.7512 40.0634,
      -5.7560 40.0620,
      -5.7610 40.0608,
      -5.7660 40.0595
    )`,
  },
];

// ── Seed principal ─────────────────────────────────────────────────────────

export async function runTourismSeed(ds: DataSource, silent = false): Promise<void> {
  const log = (msg: string) => { if (!silent) console.log(msg); };

  // Obtener IDs de hoteles en el mismo orden que hotelsData del seed base
  const hotels = await ds.query(`
    SELECT id, name FROM hotels ORDER BY created_at ASC
  `);

  if (hotels.length === 0) {
    throw new Error('❌ No hay hoteles en la BD. Ejecuta primero: npm run seed');
  }

  log(`🏨 ${hotels.length} hoteles encontrados`);

  // Limpiar tablas antes de insertar
  await ds.query(`DELETE FROM restaurants`);
  await ds.query(`DELETE FROM hiking_routes`);
  log('🧹 Tablas restaurants y hiking_routes limpiadas');

  // ── Restaurantes ───────────────────────────────────────────────────────
  let totalRestaurants = 0;

  for (const r of restaurantsData) {
    const hotel = hotels[r.hotelIndex];
    if (!hotel) continue;

    await ds.query(`
      INSERT INTO restaurants (
        hotel_id, name, description, location,
        phone, website, cuisine_type, price_range,
        rating, images, is_active
      ) VALUES (
        $1, $2, $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326),
        $6, $7, $8, $9, $10, $11, true
      )
    `, [
      hotel.id,
      r.name,
      r.description,
      r.lng, r.lat,
      r.phone,
      r.website,
      r.cuisineType,
      r.priceRange,
      r.rating,
      r.images,
    ]);

    totalRestaurants++;
  }

  log(`🍽️  ${totalRestaurants} restaurantes creados`);

  // ── Rutas de senderismo ────────────────────────────────────────────────
  let totalRoutes = 0;

  for (const route of hikingRoutesData) {
    const hotel = hotels[route.hotelIndex];
    if (!hotel) continue;

    // Limpiar espacios/saltos del WKT para que PostGIS lo parse bien
    const wkt = route.routeGeom.replace(/\s+/g, ' ').trim();

    await ds.query(`
      INSERT INTO hiking_routes (
        hotel_id, name, description, difficulty,
        distance_km, elevation_gain_m, duration_minutes,
        route_geom, gpx_file_url, images, is_active
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        ST_GeomFromText($8, 4326),
        $9, $10, true
      )
    `, [
      hotel.id,
      route.name,
      route.description,
      route.difficulty,
      route.distanceKm,
      route.elevationGainM,
      route.durationMinutes,
      wkt,
      route.gpxFileUrl,
      route.images,
    ]);

    totalRoutes++;
  }

  log(`⛰️  ${totalRoutes} rutas de senderismo creadas`);
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
  await runTourismSeed(ds);
  await ds.destroy();

  console.log('\n✅ Seed de turismo completado');
  console.log('──────────────────────────────────────────');
  console.log(`  🍽️  ${restaurantsData.length} restaurantes`);
  console.log(`  ⛰️  ${hikingRoutesData.length} rutas de senderismo`);
  console.log('──────────────────────────────────────────');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error en seed de turismo:', err.message);
    process.exit(1);
  });
}