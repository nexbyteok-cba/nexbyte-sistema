import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getSettings(req, res) {
  try {
    const settingsRows = await query('SELECT key, value FROM business_settings');
    const settings = {};
    settingsRows.forEach(r => {
      settings[r.key] = r.value;
    });

    const equipmentTypes = await query('SELECT * FROM equipment_types WHERE is_active = 1');
    const equipmentBrands = await query('SELECT * FROM equipment_brands WHERE is_active = 1 ORDER BY name ASC');
    const serviceCategories = await query('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY name ASC');

    return res.json({
      settings,
      equipmentTypes,
      equipmentBrands,
      serviceCategories,
    });
  } catch (err) {
    console.error('Error al obtener configuraciones:', err);
    return res.status(500).json({ error: 'Error al consultar configuración del sistema.' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Datos de configuración inválidos.' });
    }

    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(settings)) {
      const existing = await queryOne('SELECT key FROM business_settings WHERE key = ?', [key]);
      if (existing) {
        await execute('UPDATE business_settings SET value = ?, updated_at = ? WHERE key = ?', [String(value), now, key]);
      } else {
        await execute('INSERT INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)', [key, String(value), now]);
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_SETTINGS',
      entityType: 'business_settings',
      entityId: 'global',
      newValues: settings,
      req,
    });

    return res.json({ message: 'Configuración actualizada exitosamente.' });
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    return res.status(500).json({ error: 'Error al guardar la configuración.' });
  }
}

export async function addBrand(req, res) {
  try {
    const { equipment_type_id, name } = req.body;
    if (!equipment_type_id || !name) {
      return res.status(400).json({ error: 'Tipo de equipo y nombre de marca son obligatorios.' });
    }

    const cleanName = name.trim();
    const existing = await queryOne(
      'SELECT id FROM equipment_brands WHERE equipment_type_id = ? AND name = ? AND is_active = 1',
      [equipment_type_id, cleanName]
    );

    if (existing) {
      return res.status(409).json({ error: 'La marca ya está registrada para esta categoría.' });
    }

    const result = await execute(
      'INSERT INTO equipment_brands (equipment_type_id, name, is_active) VALUES (?, ?, 1)',
      [equipment_type_id, cleanName]
    );

    return res.status(201).json({ id: Number(result.lastInsertRowid), equipment_type_id, name: cleanName });
  } catch (err) {
    console.error('Error al agregar marca:', err);
    return res.status(500).json({ error: 'Error al registrar nueva marca.' });
  }
}

export async function addServiceCategory(req, res) {
  try {
    const { name, description, default_price = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del servicio es obligatorio.' });
    }

    const cleanName = name.trim();
    const existing = await queryOne('SELECT id FROM service_categories WHERE name = ?', [cleanName]);
    if (existing) {
      return res.status(409).json({ error: 'El servicio ya se encuentra registrado.' });
    }

    const result = await execute(
      'INSERT INTO service_categories (name, description, default_price, is_active) VALUES (?, ?, ?, 1)',
      [cleanName, description ? description.trim() : null, parseFloat(default_price) || 0]
    );

    return res.status(201).json({ id: Number(result.lastInsertRowid), name: cleanName, default_price });
  } catch (err) {
    console.error('Error al agregar servicio:', err);
    return res.status(500).json({ error: 'Error al registrar nueva categoría de servicio.' });
  }
}
