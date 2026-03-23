-- 1. DROP columnas viejas
ALTER TABLE users DROP COLUMN IF EXISTS "resetPasswordToken";
ALTER TABLE users DROP COLUMN IF EXISTS "resetPasswordExpires";
DROP INDEX IF EXISTS idx_reset_token;

-- 2. ADD snake_case nuevas
ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(500);

ALTER TABLE users 
ADD COLUMN reset_password_expires TIMESTAMP;

