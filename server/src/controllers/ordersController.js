import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getOrders(req, res) {
  try {
    const { status, client_id, search, from, to } = req.query;
    let sql = `
      SELECT o.*,
             c.first_name, c.last_name, c.phone as client_phone, c.email as client_email,
             e.brand, e.model, e.serial_number, et.name as equipment_type_name, et.icon as equipment_type_icon,
             u.full_name as technician_name
      FROM service_orders o
      JOIN clients c ON o.client_id = c.id
      JOIN equipment e ON o.equipment_id = e.id
      JOIN equipment_types et ON e.equipment_type_id = et.id
      LEFT JOIN users u ON o.technician_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'todos') {
      sql += ' AND o.current_status = ?';
      params.push(status);
    }

    if (client_id) {
      sql += ' AND o.client_id = ?';
      params.push(client_id);
    }

    if (from && to) {
      sql += ' AND o.reception_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (o.order_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR e.model LIKE ? OR e.brand LIKE ? OR e.serial_number LIKE ?)`;
      params.push(term, term, term, term, term, term, term);
    }

    sql += ' ORDER BY o.id DESC';
    const orders = await query(sql, params);
    return res.json(orders);
  } catch (err) {
    console.error('Error al obtener órdenes:', err);
    return res.status(500).json({ error: 'Error al consultar órdenes de trabajo.' });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    // Buscar orden con datos relacionados
    const order = await queryOne(
      `SELECT o.*,
              c.first_name, c.last_name, c.phone as client_phone, c.phone_alt as client_phone_alt,
              c.email as client_email, c.dni as client_dni, c.address as client_address,
              e.brand, e.model, e.serial_number, e.color, e.os, e.notes as equipment_notes,
              et.name as equipment_type_name, et.icon as equipment_type_icon,
              u.full_name as technician_name
       FROM service_orders o
       JOIN clients c ON o.client_id = c.id
       JOIN equipment e ON o.equipment_id = e.id
       JOIN equipment_types et ON e.equipment_type_id = et.id
       LEFT JOIN users u ON o.technician_id = u.id
       WHERE o.id = ? OR o.order_number = ?`,
      [id, id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada.' });
    }

    const orderId = order.id;

    // Consultas relacionadas en paralelo
    const [
      services,
      accessories,
      condition,
      photos,
      signature,
      consent,
      statusHistory,
      diagnostic,
      authorizations,
      parts,
      payments,
    ] = await Promise.all([
      query('SELECT * FROM order_services WHERE order_id = ?', [orderId]),
      query('SELECT * FROM order_accessories WHERE order_id = ?', [orderId]),
      queryOne('SELECT * FROM order_conditions WHERE order_id = ?', [orderId]),
      query('SELECT * FROM order_photos WHERE order_id = ? ORDER BY id ASC', [orderId]),
      queryOne('SELECT * FROM order_signatures WHERE order_id = ?', [orderId]),
      queryOne('SELECT * FROM order_consents WHERE order_id = ?', [orderId]),
      query(
        `SELECT h.*, u.full_name as user_name 
         FROM order_status_history h 
         LEFT JOIN users u ON h.changed_by_user_id = u.id 
         WHERE h.order_id = ? ORDER BY h.id ASC`,
        [orderId]
      ),
      queryOne('SELECT * FROM technical_diagnostics WHERE order_id = ?', [orderId]),
      query('SELECT * FROM repair_authorizations WHERE order_id = ? ORDER BY id DESC', [orderId]),
      query(
        `SELECT p.*, i.code as item_code, i.name as item_name
         FROM order_parts p
         LEFT JOIN inventory_items i ON p.item_id = i.id
         WHERE p.order_id = ?`,
        [orderId]
      ),
      query(
        `SELECT p.*, u.full_name as received_by_name
         FROM payments p
         LEFT JOIN users u ON p.received_by_user_id = u.id
         WHERE p.order_id = ? ORDER BY p.id ASC`,
        [orderId]
      ),
    ]);

    return res.json({
      ...order,
      services,
      accessories,
      condition,
      photos,
      signature,
      consent,
      statusHistory,
      diagnostic,
      authorizations,
      parts,
      payments,
    });
  } catch (err) {
    console.error('Error al obtener detalle de la orden:', err);
    return res.status(500).json({ error: 'Error al consultar la orden de trabajo.' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await queryOne('SELECT * FROM service_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const previousStatus = order.current_status;
    const now = new Date().toISOString();
    const userId = req.user.id;

    let realCompletionDate = order.real_completion_date;
    if (status === 'reparado' && !realCompletionDate) {
      realCompletionDate = now.split('T')[0];
    }

    await execute(
      'UPDATE service_orders SET current_status = ?, real_completion_date = ?, updated_at = ? WHERE id = ?',
      [status, realCompletionDate, now, id]
    );

    await execute(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, notes, changed_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, previousStatus, status, notes || `Cambio de estado a ${status}`, userId, now]
    );

    await logAudit({
      userId,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'service_orders',
      entityId: id,
      oldValues: { status: previousStatus },
      newValues: { status, notes },
      req,
    });

    return res.json({ message: 'Estado actualizado correctamente.', current_status: status });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    return res.status(500).json({ error: 'Error al cambiar estado de la orden.' });
  }
}

export async function saveDiagnostic(req, res) {
  try {
    const { id } = req.params;
    const {
      reported_issue,
      technical_diagnosis,
      tests_performed,
      detected_failures,
      damaged_components,
      proposed_solution,
      required_parts,
      estimated_cost,
      notes,
    } = req.body;

    const order = await queryOne('SELECT * FROM service_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;

    const existing = await queryOne('SELECT id FROM technical_diagnostics WHERE order_id = ?', [id]);
    if (existing) {
      await execute(
        `UPDATE technical_diagnostics SET
           reported_issue = ?, technical_diagnosis = ?, tests_performed = ?,
           detected_failures = ?, damaged_components = ?, proposed_solution = ?,
           required_parts = ?, estimated_cost = ?, notes = ?, technician_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          reported_issue || null,
          technical_diagnosis || null,
          tests_performed || null,
          detected_failures || null,
          damaged_components || null,
          proposed_solution || null,
          required_parts || null,
          parseFloat(estimated_cost) || 0,
          notes || null,
          userId,
          now,
          existing.id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO technical_diagnostics (
           order_id, reported_issue, technical_diagnosis, tests_performed,
           detected_failures, damaged_components, proposed_solution,
           required_parts, estimated_cost, notes, technician_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          reported_issue || null,
          technical_diagnosis || null,
          tests_performed || null,
          detected_failures || null,
          damaged_components || null,
          proposed_solution || null,
          required_parts || null,
          parseFloat(estimated_cost) || 0,
          notes || null,
          userId,
          now,
          now,
        ]
      );
    }

    // Si la orden estaba en recibido o pendiente_diagnostico, sugerir pasar a diagnosticado
    if (['recibido', 'pendiente_diagnostico', 'en_control'].includes(order.current_status)) {
      await execute(
        'UPDATE service_orders SET current_status = ?, updated_at = ? WHERE id = ?',
        ['diagnosticado', now, id]
      );
      await execute(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, notes, changed_by_user_id, created_at)
         VALUES (?, ?, 'diagnosticado', 'Diagnóstico técnico asentado', ?, ?)`,
        [id, order.current_status, userId, now]
      );
    }

    await logAudit({
      userId,
      action: 'SAVE_DIAGNOSTIC',
      entityType: 'technical_diagnostics',
      entityId: id,
      newValues: { technical_diagnosis, estimated_cost },
      req,
    });

    return res.json({ message: 'Diagnóstico registrado con éxito.' });
  } catch (err) {
    console.error('Error al guardar diagnóstico:', err);
    return res.status(500).json({ error: 'Error al registrar el diagnóstico técnico.' });
  }
}

export async function addAuthorization(req, res) {
  try {
    const { id } = req.params;
    const { authorized_by, authorization_method, authorized_amount, notes } = req.body;

    if (!authorized_by || !authorization_method) {
      return res.status(400).json({ error: 'Debe especificar quién autorizó y por qué medio.' });
    }

    const now = new Date().toISOString();
    await execute(
      `INSERT INTO repair_authorizations (order_id, authorized_by, authorization_method, authorized_amount, authorized_at, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, authorized_by.trim(), authorization_method.trim(), parseFloat(authorized_amount) || 0, now, notes || null]
    );

    // Actualizar estado a 'en_reparacion' si estaba esperando autorización
    const order = await queryOne('SELECT current_status FROM service_orders WHERE id = ?', [id]);
    if (order && order.current_status === 'esperando_autorizacion') {
      await execute("UPDATE service_orders SET current_status = 'en_reparacion', updated_at = ? WHERE id = ?", [now, id]);
      await execute(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, notes, changed_by_user_id, created_at)
         VALUES (?, 'esperando_autorizacion', 'en_reparacion', 'Reparación autorizada por el cliente', ?, ?)`,
        [id, req.user.id, now]
      );
    }

    return res.status(201).json({ message: 'Autorización registrada correctamente.' });
  } catch (err) {
    console.error('Error al registrar autorización:', err);
    return res.status(500).json({ error: 'Error al registrar la autorización.' });
  }
}

export async function addOrderPart(req, res) {
  try {
    const { id } = req.params;
    const { item_id, part_name, quantity, unit_price } = req.body;

    const qty = parseInt(quantity, 10) || 1;
    const price = parseFloat(unit_price) || 0;
    const totalPrice = qty * price;
    const now = new Date().toISOString();
    const userId = req.user.id;

    // Si viene de inventario, validar stock y descontar
    if (item_id) {
      const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [item_id]);
      if (!item) {
        return res.status(404).json({ error: 'Artículo de inventario no encontrado.' });
      }

      if (item.quantity < qty) {
        return res.status(400).json({
          error: `Stock insuficiente en inventario. Disponible: ${item.quantity}, Solicitado: ${qty}.`,
        });
      }

      const prevQty = item.quantity;
      const newQty = prevQty - qty;

      await execute('UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE id = ?', [newQty, now, item_id]);

      await execute(
        `INSERT INTO inventory_movements (item_id, type, quantity, previous_quantity, new_quantity, unit_cost, reference_type, reference_id, notes, user_id, created_at)
         VALUES (?, 'uso_reparacion', ?, ?, ?, ?, 'orden_trabajo', ?, 'Utilizado en reparación', ?, ?)`,
        [item_id, qty, prevQty, newQty, item.cost_price, id, userId, now]
      );
    }

    await execute(
      `INSERT INTO order_parts (order_id, item_id, part_name, quantity, unit_price, total_price, added_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, item_id || null, part_name, qty, price, totalPrice, userId, now]
    );

    // Actualizar total y saldo de la orden
    const order = await queryOne('SELECT total_amount, paid_amount FROM service_orders WHERE id = ?', [id]);
    const newTotal = order.total_amount + totalPrice;
    const newBalance = Math.max(0, newTotal - order.paid_amount);

    await execute(
      'UPDATE service_orders SET total_amount = ?, balance_amount = ?, updated_at = ? WHERE id = ?',
      [newTotal, newBalance, now, id]
    );

    return res.status(201).json({ message: 'Repuesto incorporado con éxito a la orden.' });
  } catch (err) {
    console.error('Error al agregar repuesto:', err);
    return res.status(500).json({ error: 'Error al agregar repuesto a la orden.' });
  }
}

export async function processDelivery(req, res) {
  try {
    const { id } = req.params;
    const {
      returned_accessories = [],
      delivery_notes,
      authorize_debt = false,
    } = req.body;

    const order = await queryOne('SELECT * FROM service_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Regla 9: Solo se entrega con deuda si se autoriza explícitamente por el administrador
    if (order.balance_amount > 0 && !authorize_debt) {
      return res.status(400).json({
        error: `La orden tiene un saldo pendiente de $${order.balance_amount.toFixed(2)}. Debe saldarse el importe o autorizar la entrega con saldo pendiente.`,
        requiresDebtAuthorization: true,
      });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;

    // Actualizar accesorios devueltos
    if (Array.isArray(returned_accessories) && returned_accessories.length > 0) {
      for (const accId of returned_accessories) {
        await execute('UPDATE order_accessories SET returned = 1 WHERE id = ? AND order_id = ?', [accId, id]);
      }
    }

    await execute(
      `UPDATE service_orders SET
         current_status = 'entregado',
         delivery_date = ?,
         delivery_authorized_with_debt = ?,
         updated_at = ?
       WHERE id = ?`,
      [now, authorize_debt ? 1 : 0, now, id]
    );

    await execute(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, notes, changed_by_user_id, created_at)
       VALUES (?, ?, 'entregado', ?, ?, ?)`,
      [
        id,
        order.current_status,
        delivery_notes || (authorize_debt ? 'Equipo entregado con saldo pendiente autorizado.' : 'Equipo entregado conforme al cliente.'),
        userId,
        now,
      ]
    );

    await logAudit({
      userId,
      action: 'DELIVER_ORDER',
      entityType: 'service_orders',
      entityId: id,
      newValues: { delivery_date: now, authorize_debt },
      req,
    });

    return res.json({ message: 'Equipo entregado y registrado exitosamente.' });
  } catch (err) {
    console.error('Error al registrar entrega:', err);
    return res.status(500).json({ error: 'Error al registrar la entrega del equipo.' });
  }
}

export async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const order = await queryOne('SELECT * FROM service_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const orderId = order.id;
    const equipmentId = order.equipment_id;

    // 1. Si había repuestos descontados, devolver el stock al inventario
    const parts = await query('SELECT item_id, quantity FROM order_parts WHERE order_id = ?', [orderId]);
    for (const part of parts) {
      if (part.item_id && part.quantity > 0) {
        await execute(
          'UPDATE inventory_items SET quantity = quantity + ?, updated_at = ? WHERE id = ?',
          [part.quantity, new Date().toISOString(), part.item_id]
        );
      }
    }

    // 2. Eliminar movimientos financieros y de caja vinculados a esta orden o sus pagos
    const payments = await query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    for (const p of payments) {
      await execute('DELETE FROM cash_movements WHERE payment_id = ?', [p.id]);
    }
    await execute('DELETE FROM financial_movements WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM payments WHERE order_id = ?', [orderId]);

    // 3. Desvincular o eliminar citas
    await execute('DELETE FROM appointments WHERE order_id = ?', [orderId]);

    // 4. Eliminar todas las tablas hijas asociadas
    await execute('DELETE FROM order_services WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_accessories WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_conditions WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_photos WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_signatures WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_consents WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_status_history WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM technical_diagnostics WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM repair_authorizations WHERE order_id = ?', [orderId]);
    await execute('DELETE FROM order_parts WHERE order_id = ?', [orderId]);

    // 5. Eliminar la orden principal
    await execute('DELETE FROM service_orders WHERE id = ?', [orderId]);

    // 6. Si el equipo no tiene ninguna otra orden de servicio, eliminar el equipo para mantener limpia la DB
    if (equipmentId) {
      const remainingOrders = await queryOne('SELECT COUNT(*) as count FROM service_orders WHERE equipment_id = ?', [equipmentId]);
      if (!remainingOrders || remainingOrders.count === 0) {
        await execute('DELETE FROM equipment WHERE id = ?', [equipmentId]);
      }
    }

    // 7. Registrar auditoría
    await logAudit({
      userId: req.user.id,
      action: 'DELETE_ORDER',
      entityType: 'service_orders',
      entityId: orderId,
      oldValues: {
        order_number: order.order_number,
        client_id: order.client_id,
        equipment_id: equipmentId,
        total_amount: order.total_amount,
      },
      req,
    });

    return res.json({ message: `Orden ${order.order_number} eliminada definitivamente del sistema.` });
  } catch (err) {
    console.error('Error al eliminar orden:', err);
    return res.status(500).json({ error: 'Error al eliminar la orden de trabajo.' });
  }
}

