INSERT INTO users (name, last_name1, email, password_hash, role) VALUES (
  'Super', 
  'Admin', 
  'superadmin@beebit.es',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password"
  'super_admin'
) RETURNING id;
