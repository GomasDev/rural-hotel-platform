CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  images TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
