import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getAppointments(req, res) {
  try {
    const { date, status, from, to } = req.query;
    let sql = `
      SELECT a.*, c.first_name, c.last_name, c.phone as client_phone_db,
             o.order_number
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN service_orders o ON a.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ' AND a.date = ?';
      params.push(date);
    } else if (from && to) {
      sql += ' AND a.date BETWEEN ? AND ?';
      params.push(from, to);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.date ASC, a.time ASC';
    const appointments = await query(sql, params);
    return res.json(appointments);
  } catch (err) {
    console.error('Error al consultar turnos:', err);
    return res.status(500).json({ error: 'Error al consultar turnos.' });
  }
}

export async function createAppointment(req, res) {
  try {
    const {
      client_id,
      client_name,
      client_phone,
      date,
      time,
      equipment_type,
      brand,
      model,
      service_requested,
      problem_description,
      notes,
      status = 'pendiente',
    } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Fecha y hora son campos obligatorios.' });
    }

    const now = new Date().toISOString();
    const result = await execute(
      `INSERT INTO appointments (
         client_id, client_name, client_phone, date, time,
         equipment_type, brand, model, service_requested,
         problem_description, notes, status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id || null,
        client_name || null,
        client_phone || null,
        date,
        time,
        equipment_type || null,
        brand || null,
        model || null,
        service_requested || null,
        problem_description || null,
        notes || null,
        status,
        now,
        now,
      ]
    );

    const newId = Number(result.lastInsertRowid);
    const newAppointment = await queryOne('SELECT * FROM appointments WHERE id = ?', [newId]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_APPOINTMENT',
      entityType: 'appointments',
      entityId: newId,
      newValues: newAppointment,
      req,
    });

    return res.status(201).json(newAppointment);
  } catch (err) {
    console.error('Error al crear turno:', err);
    return res.status(500).json({ error: 'Error al registrar turno.' });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const current = await queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    const {
      client_id,
      client_name,
      client_phone,
      date,
      time,
      equipment_type,
      brand,
      model,
      service_requested,
      problem_description,
      notes,
      status,
      order_id,
    } = req.body;

    const now = new Date().toISOString();
    await execute(
      `UPDATE appointments SET
         client_id = ?, client_name = ?, client_phone = ?, date = ?, time = ?,
         equipment_type = ?, brand = ?, model = ?, service_requested = ?,
         problem_description = ?, notes = ?, status = ?, order_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        client_id !== undefined ? client_id : current.client_id,
        client_name !== undefined ? client_name : current.client_name,
        client_phone !== undefined ? client_phone : current.client_phone,
        date !== undefined ? date : current.date,
        time !== undefined ? time : current.time,
        equipment_type !== undefined ? equipment_type : current.equipment_type,
        brand !== undefined ? brand : current.brand,
        model !== undefined ? model : current.model,
        service_requested !== undefined ? service_requested : current.service_requested,
        problem_description !== undefined ? problem_description : current.problem_description,
        notes !== undefined ? notes : current.notes,
        status !== undefined ? status : current.status,
        order_id !== undefined ? order_id : current.order_id,
        now,
        id,
      ]
    );

    const updated = await queryOne('SELECT * FROM appointments WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_APPOINTMENT',
      entityType: 'appointments',
      entityId: id,
      oldValues: current,
      newValues: updated,
      req,
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error al actualizar turno:', err);
    return res.status(500).json({ error: 'Error al actualizar turno.' });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const current = await queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    await execute('DELETE FROM appointments WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_APPOINTMENT',
      entityType: 'appointments',
      entityId: id,
      oldValues: current,
      req,
    });

    return res.json({ message: 'Turno eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar turno:', err);
    return res.status(500).json({ error: 'Error al eliminar turno.' });
  }
}
