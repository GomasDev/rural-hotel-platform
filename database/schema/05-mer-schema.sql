-- migrations/001_restaurants_hiking_routes.sql
-- Requiere: CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────
-- ENUM: dificultad de ruta
-- ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE difficulty_enum AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- TABLA: restaurants
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  location    GEOGRAPHY(Point, 4326) NOT NULL,
  phone       VARCHAR(20),
  website     VARCHAR(255),
  cuisine_type VARCHAR(100),
  price_range VARCHAR(10) CHECK (price_range IN ('€', '€€', '€€€')),
  rating      DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  images      TEXT[],
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Índices restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_hotel_id
  ON restaurants(hotel_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_location
  ON restaurants USING GIST(location);

-- ─────────────────────────────────────────────
-- TABLA: hiking_routes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hiking_routes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name              VARCHAR(150) NOT NULL,
  description       TEXT,
  difficulty        difficulty_enum NOT NULL,
  distance_km       DECIMAL(6,2)  NOT NULL CHECK (distance_km > 0),
  elevation_gain_m  INTEGER       CHECK (elevation_gain_m >= 0),
  duration_minutes  INTEGER       CHECK (duration_minutes > 0),
  route_geom        GEOMETRY(LineString, 4326) NOT NULL,
  gpx_file_url      VARCHAR(255),
  images            TEXT[],
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Índices hiking_routes
CREATE INDEX IF NOT EXISTS idx_hiking_routes_hotel_id
  ON hiking_routes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hiking_routes_difficulty
  ON hiking_routes(difficulty);
CREATE INDEX IF NOT EXISTS idx_hiking_routes_geom
  ON hiking_routes USING GIST(route_geom);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_hiking_routes_updated_at
  BEFORE UPDATE ON hiking_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();