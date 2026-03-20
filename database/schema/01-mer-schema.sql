-- SOLO users (exacto tu diseño)
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'client');
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    last_name1 VARCHAR(50) NOT NULL,
    last_name2 VARCHAR(50),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
