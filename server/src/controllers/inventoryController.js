import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getInventory(req, res) {
  try {
    const { category_id, search, low_stock } = req.query;
    let sql = `
      SELECT i.*, c.name as category_name, s.name as supplier_name
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.is_active = 1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND i.category_id = ?';
      params.push(category_id);
    }

    if (low_stock === 'true') {
      sql += ' AND i.quantity <= i.min_stock';
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (i.code LIKE ? OR i.name LIKE ? OR i.brand LIKE ? OR i.model LIKE ?)';
      params = [...params, term, term, term, term];
    }

    sql += ' ORDER BY i.name ASC';
    const items = await query(sql, params);
    return res.json(items);
  } catch (err) {
    console.error('Error al obtener inventario:', err);
    return res.status(500).json({ error: 'Error al consultar inventario.' });
  }
}

export async function createItem(req, res) {
  try {
    const {
      code,
      name,
      category_id,
      brand,
      model,
      description,
      quantity = 0,
      min_stock = 2,
      cost_price = 0,
      sale_price = 0,
      supplier_id,
      location,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Código y nombre son obligatorios.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await queryOne('SELECT id FROM inventory_items WHERE code = ?', [cleanCode]);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un artículo registrado con ese código.' });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;
    const qty = parseInt(quantity, 10) || 0;

    const result = await execute(
      `INSERT INTO inventory_items (
         code, name, category_id, brand, model, description,
         quantity, min_stock, cost_price, sale_price, supplier_id,
         location, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        cleanCode,
        name.trim(),
        category_id || null,
        brand ? brand.trim() : null,
        model ? model.trim() : null,
        description ? description.trim() : null,
        qty,
        parseInt(min_stock, 10) || 2,
        parseFloat(cost_price) || 0,
        parseFloat(sale_price) || 0,
        supplier_id || null,
        location ? location.trim() : null,
        now,
        now,
      ]
    );

    const newItemId = Number(result.lastInsertRowid);

    // Si entra con cantidad inicial > 0, registrar movimiento
    if (qty > 0) {
      await execute(
        `INSERT INTO inventory_movements (item_id, type, quantity, previous_quantity, new_quantity, unit_cost, reference_type, notes, user_id, created_at)
         VALUES (?, 'ingreso', ?, 0, ?, ?, 'stock_inicial', 'Carga inicial de stock', ?, ?)`,
        [newItemId, qty, qty, parseFloat(cost_price) || 0, userId, now]
      );
    }

    await logAudit({
      userId,
      action: 'CREATE_INVENTORY_ITEM',
      entityType: 'inventory_items',
      entityId: newItemId,
      newValues: { code: cleanCode, name, qty },
      req,
    });

    const newItem = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [newItemId]);
    return res.status(201).json(newItem);
  } catch (err) {
    console.error('Error al crear artículo:', err);
    return res.status(500).json({ error: 'Error al registrar artículo en inventario.' });
  }
}

export async function adjustStock(req, res) {
  try {
    const { id } = req.params;
    const { type, quantity, notes, unit_cost } = req.body; // type: 'ingreso', 'egreso', 'ajuste'

    const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    const delta = parseInt(quantity, 10);
    if (isNaN(delta) || delta <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a cero.' });
    }

    const prevQty = item.quantity;
    let newQty = prevQty;

    if (type === 'ingreso') {
      newQty = prevQty + delta;
    } else if (type === 'egreso') {
      if (prevQty < delta) {
        return res.status(400).json({ error: 'Stock insuficiente para realizar el egreso.' });
      }
      newQty = prevQty - delta;
    } else if (type === 'ajuste') {
      newQty = delta; // en ajuste directo, cantidad es el nuevo valor real
    } else {
      return res.status(400).json({ error: 'Tipo de ajuste no reconocido.' });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;

    await execute('UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, now, id]);

    await execute(
      `INSERT INTO inventory_movements (item_id, type, quantity, previous_quantity, new_quantity, unit_cost, reference_type, notes, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ajuste_manual', ?, ?, ?)`,
      [id, type, delta, prevQty, newQty, unit_cost || item.cost_price, notes || null, userId, now]
    );

    await logAudit({
      userId,
      action: 'ADJUST_STOCK',
      entityType: 'inventory_items',
      entityId: id,
      oldValues: { quantity: prevQty },
      newValues: { quantity: newQty, type, delta },
      req,
    });

    return res.json({ message: 'Stock actualizado con éxito.', previous_quantity: prevQty, new_quantity: newQty });
  } catch (err) {
    console.error('Error al ajustar stock:', err);
    return res.status(500).json({ error: 'Error al ajustar stock de inventario.' });
  }
}

export async function getItemMovements(req, res) {
  try {
    const { id } = req.params;
    const movements = await query(
      `SELECT m.*, u.full_name as user_name
       FROM inventory_movements m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.item_id = ? ORDER BY m.id DESC`,
      [id]
    );
    return res.json(movements);
  } catch (err) {
    console.error('Error al obtener movimientos:', err);
    return res.status(500).json({ error: 'Error al consultar movimientos del artículo.' });
  }
}
