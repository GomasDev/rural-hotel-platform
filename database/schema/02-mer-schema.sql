CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE hotels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  images TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
