-- NEXBYTE MANAGER: Schema SQL con integridad referencial completa e índices

PRAGMA foreign_keys = ON;

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Clientes
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  phone TEXT NOT NULL,
  phone_alt TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Tipos de equipos
CREATE TABLE IF NOT EXISTS equipment_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 4. Marcas de equipos por tipo
CREATE TABLE IF NOT EXISTS equipment_brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 5. Equipos registrados
CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  color TEXT,
  os TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Categorías de servicios
CREATE TABLE IF NOT EXISTS service_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_price REAL NOT NULL DEFAULT 0.00,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 7. Órdenes de Servicio / Trabajo
CREATE TABLE IF NOT EXISTS service_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reception_date TEXT NOT NULL,
  estimated_days INTEGER NOT NULL DEFAULT 3,
  estimated_completion_date TEXT NOT NULL,
  real_completion_date TEXT,
  current_status TEXT NOT NULL DEFAULT 'recibido',
  total_amount REAL NOT NULL DEFAULT 0.00,
  deposit_amount REAL NOT NULL DEFAULT 0.00,
  paid_amount REAL NOT NULL DEFAULT 0.00,
  balance_amount REAL NOT NULL DEFAULT 0.00,
  observations TEXT,
  is_locked INTEGER NOT NULL DEFAULT 1,
  locked_at TEXT,
  delivery_authorized_with_debt INTEGER NOT NULL DEFAULT 0,
  delivery_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 8. Servicios incluidos en la orden
CREATE TABLE IF NOT EXISTS order_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0.00,
  notes TEXT
);

-- 9. Accesorios entregados
CREATE TABLE IF NOT EXISTS order_accessories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  received INTEGER NOT NULL DEFAULT 1,
  returned INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- 10. Condiciones físicas de recepción
CREATE TABLE IF NOT EXISTS order_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE REFERENCES service_orders(id) ON DELETE CASCADE,
  has_no_issues INTEGER NOT NULL DEFAULT 0,
  general_condition TEXT,
  scratches INTEGER NOT NULL DEFAULT 0,
  dents INTEGER NOT NULL DEFAULT 0,
  cracks INTEGER NOT NULL DEFAULT 0,
  damaged_screen INTEGER NOT NULL DEFAULT 0,
  damaged_hinges INTEGER NOT NULL DEFAULT 0,
  missing_screws INTEGER NOT NULL DEFAULT 0,
  missing_components INTEGER NOT NULL DEFAULT 0,
  damaged_ports INTEGER NOT NULL DEFAULT 0,
  previous_tampering INTEGER NOT NULL DEFAULT 0,
  dirtiness INTEGER NOT NULL DEFAULT 0,
  visible_humidity INTEGER NOT NULL DEFAULT 0,
  other_details TEXT,
  detailed_notes TEXT
);

-- 11. Fotografías de la recepción
CREATE TABLE IF NOT EXISTS order_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  public_id TEXT,
  category TEXT NOT NULL DEFAULT 'frente',
  description TEXT,
  uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 12. Firma electrónica
CREATE TABLE IF NOT EXISTS order_signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE REFERENCES service_orders(id) ON DELETE CASCADE,
  signature_data_url TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_dni_or_phone TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  signed_at TEXT NOT NULL
);

-- 13. Consentimiento y términos
CREATE TABLE IF NOT EXISTS order_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  consent_text TEXT NOT NULL,
  agreed INTEGER NOT NULL DEFAULT 1,
  agreed_at TEXT NOT NULL
);

-- 14. Historial de estados de la orden
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 15. Diagnóstico técnico
CREATE TABLE IF NOT EXISTS technical_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE REFERENCES service_orders(id) ON DELETE CASCADE,
  reported_issue TEXT,
  technical_diagnosis TEXT,
  tests_performed TEXT,
  detected_failures TEXT,
  damaged_components TEXT,
  proposed_solution TEXT,
  required_parts TEXT,
  estimated_cost REAL DEFAULT 0.00,
  notes TEXT,
  technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 16. Autorizaciones de reparación del cliente
CREATE TABLE IF NOT EXISTS repair_authorizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  authorized_by TEXT NOT NULL,
  authorization_method TEXT NOT NULL,
  authorized_amount REAL NOT NULL DEFAULT 0.00,
  authorized_at TEXT NOT NULL,
  notes TEXT
);

-- 17. Turnos y Agenda
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  equipment_type TEXT,
  brand TEXT,
  model TEXT,
  service_requested TEXT,
  problem_description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  order_id INTEGER REFERENCES service_orders(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 18. Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 19. Categorías de inventario
CREATE TABLE IF NOT EXISTS inventory_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 20. Artículos de inventario
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES inventory_categories(id) ON DELETE RESTRICT,
  brand TEXT,
  model TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 2,
  cost_price REAL NOT NULL DEFAULT 0.00,
  sale_price REAL NOT NULL DEFAULT 0.00,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  location TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 21. Movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  unit_cost REAL DEFAULT 0.00,
  reference_type TEXT,
  reference_id INTEGER,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 22. Repuestos asociados a la orden
CREATE TABLE IF NOT EXISTS order_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0.00,
  total_price REAL NOT NULL DEFAULT 0.00,
  added_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 23. Cajas registradoras (Sesiones de caja)
CREATE TABLE IF NOT EXISTS cash_registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opened_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  closed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  initial_balance REAL NOT NULL DEFAULT 0.00,
  expected_balance REAL DEFAULT 0.00,
  actual_balance REAL DEFAULT 0.00,
  difference REAL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'abierta',
  notes TEXT
);

-- 24. Movimientos de caja
CREATE TABLE IF NOT EXISTS cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL REFERENCES cash_registers(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  reference_type TEXT,
  reference_id INTEGER,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 25. Pagos de órdenes
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE RESTRICT,
  amount REAL NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_code TEXT,
  notes TEXT,
  cash_movement_id INTEGER REFERENCES cash_movements(id) ON DELETE SET NULL,
  received_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 26. Movimientos financieros generales
CREATE TABLE IF NOT EXISTS financial_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference_code TEXT,
  order_id INTEGER REFERENCES service_orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 27. Configuración del negocio
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 28. Logs de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- ÍNDICES PARA ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_orders_number ON service_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_client ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_reception_date ON service_orders(reception_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory_items(code);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_movements(date);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_movements(type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_reg ON cash_movements(register_id);
