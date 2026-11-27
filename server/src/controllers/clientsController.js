import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getClients(req, res) {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM clients WHERE is_active = 1';
    let params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR phone_alt LIKE ? OR email LIKE ? OR dni LIKE ?)';
      params = [term, term, term, term, term, term];
    }

    sql += ' ORDER BY created_at DESC';
    const clients = await query(sql, params);
    return res.json(clients);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    return res.status(500).json({ error: 'Error al consultar clientes.' });
  }
}

export async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const client = await queryOne('SELECT * FROM clients WHERE id = ?', [id]);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Historial de equipos del cliente
    const equipment = await query(
      `SELECT e.*, et.name as type_name, et.icon as type_icon
       FROM equipment e
       JOIN equipment_types et ON e.equipment_type_id = et.id
       WHERE e.client_id = ? ORDER BY e.created_at DESC`,
      [id]
    );

    // Historial de órdenes de trabajo
    const orders = await query(
      `SELECT o.*, e.model, e.brand, et.name as type_name
       FROM service_orders o
       JOIN equipment e ON o.equipment_id = e.id
       JOIN equipment_types et ON e.equipment_type_id = et.id
       WHERE o.client_id = ? ORDER BY o.reception_date DESC`,
      [id]
    );

    // Resumen de pagos y deudas
    const paymentSummary = await queryOne(
      `SELECT
         COALESCE(SUM(total_amount), 0) as total_invoiced,
         COALESCE(SUM(paid_amount), 0) as total_paid,
         COALESCE(SUM(balance_amount), 0) as total_pending_debt
       FROM service_orders
       WHERE client_id = ?`,
      [id]
    );

    return res.json({
      ...client,
      equipment,
      orders,
      summary: paymentSummary,
    });
  } catch (err) {
    console.error('Error al obtener detalle del cliente:', err);
    return res.status(500).json({ error: 'Error al consultar detalle del cliente.' });
  }
}

export async function createClient(req, res) {
  try {
    const { first_name, last_name, dni, phone, phone_alt, email, address, notes } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'Nombre, apellido y teléfono son campos obligatorios.' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Validación contra duplicados (Instrucción 5)
    let duplicateCheckSql = 'SELECT * FROM clients WHERE is_active = 1 AND phone = ?';
    let duplicateParams = [cleanPhone];

    if (cleanEmail) {
      duplicateCheckSql += ' OR email = ?';
      duplicateParams.push(cleanEmail);
    }

    const duplicate = await queryOne(duplicateCheckSql, duplicateParams);
    if (duplicate) {
      return res.status(409).json({
        error: `Ya existe un cliente registrado con ese teléfono (${duplicate.phone}) o correo (${duplicate.email || 'N/A'}).`,
        existingClient: duplicate,
      });
    }

    const now = new Date().toISOString();
    const result = await execute(
      `INSERT INTO clients (first_name, last_name, dni, phone, phone_alt, email, address, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        dni ? dni.trim() : null,
        cleanPhone,
        phone_alt ? phone_alt.trim() : null,
        cleanEmail,
        address ? address.trim() : null,
        notes ? notes.trim() : null,
        now,
        now,
      ]
    );

    const newClientId = Number(result.lastInsertRowid);
    const newClient = await queryOne('SELECT * FROM clients WHERE id = ?', [newClientId]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_CLIENT',
      entityType: 'clients',
      entityId: newClientId,
      newValues: newClient,
      req,
    });

    return res.status(201).json(newClient);
  } catch (err) {
    console.error('Error al crear cliente:', err);
    return res.status(500).json({ error: 'Error al registrar cliente.' });
  }
}

export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { first_name, last_name, dni, phone, phone_alt, email, address, notes } = req.body;

    const current = await queryOne('SELECT * FROM clients WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const cleanPhone = phone ? phone.trim() : current.phone;
    const cleanEmail = email !== undefined ? (email ? email.trim().toLowerCase() : null) : current.email;

    // Verificar que otro cliente no tenga el mismo teléfono o email
    if (cleanPhone !== current.phone || (cleanEmail && cleanEmail !== current.email)) {
      const duplicate = await queryOne(
        'SELECT * FROM clients WHERE id != ? AND is_active = 1 AND (phone = ? OR (email IS NOT NULL AND email = ?))',
        [id, cleanPhone, cleanEmail || '']
      );
      if (duplicate) {
        return res.status(409).json({ error: 'El teléfono o correo ya pertenece a otro cliente registrado.' });
      }
    }

    const now = new Date().toISOString();
    await execute(
      `UPDATE clients SET
         first_name = ?, last_name = ?, dni = ?, phone = ?, phone_alt = ?,
         email = ?, address = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        first_name ? first_name.trim() : current.first_name,
        last_name ? last_name.trim() : current.last_name,
        dni !== undefined ? (dni ? dni.trim() : null) : current.dni,
        cleanPhone,
        phone_alt !== undefined ? (phone_alt ? phone_alt.trim() : null) : current.phone_alt,
        cleanEmail,
        address !== undefined ? (address ? address.trim() : null) : current.address,
        notes !== undefined ? (notes ? notes.trim() : null) : current.notes,
        now,
        id,
      ]
    );

    const updated = await queryOne('SELECT * FROM clients WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_CLIENT',
      entityType: 'clients',
      entityId: id,
      oldValues: current,
      newValues: updated,
      req,
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    return res.status(500).json({ error: 'Error al actualizar información del cliente.' });
  }
}

export async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    const current = await queryOne('SELECT * FROM clients WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const orderCount = await queryOne('SELECT COUNT(*) as count FROM service_orders WHERE client_id = ?', [id]);

    if (hard === 'true' || orderCount?.count === 0) {
      // Eliminar citas, equipos y órdenes asociadas si se pide hard delete o si fue cargado sin órdenes
      if (orderCount?.count > 0) {
        const orders = await query('SELECT id FROM service_orders WHERE client_id = ?', [id]);
        for (const ord of orders) {
          await execute('DELETE FROM order_services WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_accessories WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_conditions WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_photos WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_signatures WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_consents WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_status_history WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM technical_diagnostics WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM repair_authorizations WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM order_parts WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM payments WHERE order_id = ?', [ord.id]);
          await execute('DELETE FROM service_orders WHERE id = ?', [ord.id]);
        }
      }

      await execute('DELETE FROM appointments WHERE client_id = ?', [id]);
      await execute('DELETE FROM equipment WHERE client_id = ?', [id]);
      await execute('DELETE FROM clients WHERE id = ?', [id]);

      await logAudit({
        userId: req.user.id,
        action: 'HARD_DELETE_CLIENT',
        entityType: 'clients',
        entityId: id,
        oldValues: current,
        req,
      });

      return res.json({ message: 'Cliente eliminado definitivamente del sistema.' });
    }

    // Baja lógica si tiene órdenes y no se solicitó forzar
    const now = new Date().toISOString();
    await execute('UPDATE clients SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_CLIENT',
      entityType: 'clients',
      entityId: id,
      oldValues: current,
      req,
    });

    return res.json({ message: 'Cliente dado de baja correctamente conservando su historial.' });
  } catch (err) {
    console.error('Error al dar de baja cliente:', err);
    return res.status(500).json({ error: 'Error al dar de baja cliente.' });
  }
}
