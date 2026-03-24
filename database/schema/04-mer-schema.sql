-- 1. Creamos el tipo ENUM para el estado de la reserva
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- 2. Creamos la tabla bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    room_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    stripe_payment_id VARCHAR(255) NULL,
    guests INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Definición de Llaves Foráneas (FK)
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);