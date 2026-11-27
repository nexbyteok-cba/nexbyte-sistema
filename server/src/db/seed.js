import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { getDb, queryOne, execute } from './index.js';
import { runMigrations } from './migrate.js';
import { config } from '../config/index.js';

export async function seedDatabase() {
  console.log('🌱 Iniciando sembrado inicial de datos (Seeding)...');
  await runMigrations();

  const now = new Date().toISOString();

  // 1. Usuario Administrador Inicial
  const existingAdmin = await queryOne('SELECT * FROM users WHERE email = ?', [config.admin.email]);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(config.admin.initialPassword, salt);

    await execute(
      `INSERT INTO users (email, password_hash, full_name, role, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 1, ?, ?)`,
      [config.admin.email, passwordHash, 'Administrador NEXBYTE', now, now]
    );
    console.log(`👤 Usuario administrador creado: ${config.admin.email}`);
  }

  // 2. Tipos de Equipos y Marcas
  const types = [
    {
      name: 'PC de escritorio',
      code: 'pc_escritorio',
      icon: 'Monitor',
      brands: ['ASUS', 'Gigabyte', 'MSI', 'ASRock', 'Intel', 'AMD', 'HP', 'Dell', 'Lenovo', 'Acer', 'Apple', 'Genérica', 'Otra']
    },
    {
      name: 'Notebook',
      code: 'notebook',
      icon: 'Laptop',
      brands: ['ASUS', 'Acer', 'Lenovo', 'HP', 'Dell', 'MSI', 'Apple', 'Samsung', 'Toshiba', 'Gigabyte', 'Huawei', 'Exo', 'Banghó', 'Positivo BGH', 'Otra']
    },
    {
      name: 'Consola',
      code: 'consola',
      icon: 'Gamepad2',
      brands: ['Sony', 'Microsoft', 'Nintendo', 'Otra']
    }
  ];

  for (const t of types) {
    let typeRow = await queryOne('SELECT id FROM equipment_types WHERE code = ?', [t.code]);
    let typeId;
    if (!typeRow) {
      const res = await execute(
        'INSERT INTO equipment_types (name, code, icon, is_active) VALUES (?, ?, ?, 1)',
        [t.name, t.code, t.icon]
      );
      typeId = Number(res.lastInsertRowid);
      console.log(`💻 Creado tipo de equipo: ${t.name}`);
    } else {
      typeId = typeRow.id;
    }

    for (const b of t.brands) {
      const brandRow = await queryOne(
        'SELECT id FROM equipment_brands WHERE equipment_type_id = ? AND name = ?',
        [typeId, b]
      );
      if (!brandRow) {
        await execute(
          'INSERT INTO equipment_brands (equipment_type_id, name, is_active) VALUES (?, ?, 1)',
          [typeId, b]
        );
      }
    }
  }

  // 3. Categorías de Servicios Iniciales
  const services = [
    { name: 'Limpieza integral', description: 'Desarme completo, soplado, limpieza ultrasónica de chasis y cambio de pasta térmica', price: 25000 },
    { name: 'Mantenimiento general', description: 'Optimización de software, limpieza superficial y actualización', price: 18000 },
    { name: 'Reparación de hardware', description: 'Reemplazo o reparación de componentes defectuosos', price: 30000 },
    { name: 'Diagnóstico técnico', description: 'Revisión exhaustiva y detección de fallas electrónicas o lógicas', price: 12000 },
    { name: 'Instalación de sistema operativo', description: 'Instalación limpia de Windows/Linux con drivers y utilitarios esenciales', price: 20000 },
    { name: 'Recuperación de datos', description: 'Extracción de archivos desde discos dañados o particiones formateadas', price: 35000 },
    { name: 'Actualización de hardware', description: 'Colocación de SSD, memoria RAM o cambio de placa de video', price: 15000 },
    { name: 'Cambio de componentes', description: 'Reemplazo de teclado, pantalla, puerto de carga o batería', price: 22000 },
    { name: 'Otro servicio técnico', description: 'Servicios específicos a cotizar', price: 0 }
  ];

  for (const s of services) {
    const sRow = await queryOne('SELECT id FROM service_categories WHERE name = ?', [s.name]);
    if (!sRow) {
      await execute(
        'INSERT INTO service_categories (name, description, default_price, is_active) VALUES (?, ?, ?, 1)',
        [s.name, s.description, s.price]
      );
    }
  }

  // 4. Categorías de Inventario
  const invCategories = [
    'Memorias RAM', 'Discos HDD', 'SSD', 'Fuentes de alimentación',
    'Procesadores', 'Placas madre', 'Placas de video', 'Gabinetes',
    'Ventiladores y Coolers', 'Pasta térmica y Pads', 'Cables y Adaptadores',
    'Componentes de notebooks', 'Componentes de consolas', 'Herramientas',
    'Insumos de taller', 'Otros'
  ];

  for (const cat of invCategories) {
    const cRow = await queryOne('SELECT id FROM inventory_categories WHERE name = ?', [cat]);
    if (!cRow) {
      await execute('INSERT INTO inventory_categories (name, description, is_active) VALUES (?, ?, 1)', [cat, cat]);
    }
  }

  // 5. Configuración Comercial Predeterminada
  const defaultSettings = [
    { key: 'company_name', value: 'NEXBYTE' },
    { key: 'company_activity', value: 'Servicio Técnico Especializado en Computadoras, Notebooks, Consolas y Electrónica' },
    { key: 'company_phone', value: '+54 9 351 000-0000' },
    { key: 'company_email', value: 'nexbyte.ok@gmail.com' },
    { key: 'company_address', value: 'Av. Colón 1234, Córdoba, Argentina' },
    { key: 'company_instagram', value: '@nexbyte.ok' },
    { key: 'receipt_terms', value: `1. El cliente declara que entrega el equipo identificado en este comprobante con las características y accesorios especificados.
2. Se deja expresa constancia de las condiciones físicas observadas y declaradas al momento de la recepción.
3. El registro fotográfico forma parte integral del presente comprobante de recepción.
4. El cliente declara conocer el servicio técnico solicitado y autoriza la apertura y revisión técnica del equipo.
5. Los plazos informados son estimativos y pueden variar de acuerdo con la disponibilidad de repuestos o complejidad del diagnóstico.
6. El diagnóstico puede revelar problemas adicionales no manifestados originalmente; cualquier reparación adicional requerirá autorización previa del cliente.
7. Se recomienda fuertemente el respaldo previo de la información personal. NEXBYTE no se responsabiliza por la pérdida de datos preexistentes en discos dañados.
8. NEXBYTE registrará de manera inviolable las intervenciones técnicas realizadas sobre el equipo.` },
    { key: 'currency_code', value: 'ARS' },
    { key: 'currency_symbol', value: '$' },
    { key: 'default_warranty_days', value: '90' },
  ];

  for (const set of defaultSettings) {
    const setRow = await queryOne('SELECT key FROM business_settings WHERE key = ?', [set.key]);
    if (!setRow) {
      await execute('INSERT INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)', [set.key, set.value, now]);
    }
  }

  // 6. Proveedores iniciales
  const sampleSupplier = await queryOne('SELECT id FROM suppliers WHERE name = ?', ['Distribuidora Mayorista Tech']);
  if (!sampleSupplier) {
    await execute(
      `INSERT INTO suppliers (name, contact_name, phone, email, address, notes, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      ['Distribuidora Mayorista Tech', 'Martín Gómez', '351-4567890', 'ventas@distritech.com', 'Córdoba Capital', 'Proveedor de SSDs y memorias', now]
    );
  }

  // 7. Artículos de Inventario Iniciales
  const sampleItems = [
    { code: 'SSD-KING-480', name: 'SSD Kingston A400 480GB SATA3', cat: 'SSD', brand: 'Kingston', model: 'A400', qty: 6, min: 2, cost: 28000, sale: 45000, loc: 'Estante A1' },
    { code: 'SSD-NVME-500', name: 'SSD Crucial P3 500GB M.2 NVMe', cat: 'SSD', brand: 'Crucial', model: 'P3', qty: 4, min: 2, cost: 38000, sale: 59000, loc: 'Estante A2' },
    { code: 'RAM-DDR4-8GB', name: 'Memoria RAM Kingston Fury Beast 8GB DDR4 3200MHz', cat: 'Memorias RAM', brand: 'Kingston', model: 'Fury Beast', qty: 8, min: 3, cost: 22000, sale: 36000, loc: 'Estante B1' },
    { code: 'RAM-DDR4-16GB', name: 'Memoria RAM Corsair Vengeance 16GB DDR4 3200MHz', cat: 'Memorias RAM', brand: 'Corsair', model: 'Vengeance', qty: 5, min: 2, cost: 41000, sale: 65000, loc: 'Estante B2' },
    { code: 'PASTA-ARCTIC-MX4', name: 'Pasta Térmica Arctic MX-4 4g', cat: 'Pasta térmica y Pads', brand: 'Arctic', model: 'MX-4', qty: 10, min: 3, cost: 8500, sale: 14000, loc: 'Taller Insumos' },
  ];

  for (const it of sampleItems) {
    const existing = await queryOne('SELECT id FROM inventory_items WHERE code = ?', [it.code]);
    if (!existing) {
      const catRow = await queryOne('SELECT id FROM inventory_categories WHERE name = ?', [it.cat]);
      const catId = catRow ? catRow.id : 1;
      await execute(
        `INSERT INTO inventory_items (code, name, category_id, brand, model, description, quantity, min_stock, cost_price, sale_price, location, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [it.code, it.name, catId, it.brand, it.model, it.name, it.qty, it.min, it.cost, it.sale, it.loc, now, now]
      );
    }
  }

  console.log('✅ Base de datos sembrada e inicializada correctamente.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en seed:', err);
      process.exit(1);
    });
}
