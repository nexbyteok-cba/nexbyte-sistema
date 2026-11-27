import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getCurrentCashSession(req, res) {
  try {
    const current = await queryOne(
      `SELECT c.*, u.full_name as opened_by_name
       FROM cash_registers c
       JOIN users u ON c.opened_by_user_id = u.id
       WHERE c.status = 'abierta'
       ORDER BY c.id DESC LIMIT 1`
    );

    if (!current) {
      return res.json({ isOpen: false, session: null });
    }

    // Calcular ingresos y egresos de la sesión
    const movementsSummary = await queryOne(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_in,
         COALESCE(SUM(CASE WHEN type = 'egreso' THEN amount ELSE 0 END), 0) as total_out
       FROM cash_movements
       WHERE register_id = ?`,
      [current.id]
    );

    const movements = await query(
      `SELECT m.*, u.full_name as user_name
       FROM cash_movements m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.register_id = ?
       ORDER BY m.id DESC`,
      [current.id]
    );

    const totalIn = movementsSummary ? movementsSummary.total_in : 0;
    const totalOut = movementsSummary ? movementsSummary.total_out : 0;
    const expectedBalance = current.initial_balance + totalIn - totalOut;

    return res.json({
      isOpen: true,
      session: {
        ...current,
        total_in: totalIn,
        total_out: totalOut,
        expected_balance: expectedBalance,
        movements,
      },
    });
  } catch (err) {
    console.error('Error al obtener sesión de caja:', err);
    return res.status(500).json({ error: 'Error al consultar estado de la caja.' });
  }
}

export async function openCashSession(req, res) {
  try {
    const { initial_balance = 0, notes } = req.body;

    const existing = await queryOne("SELECT id FROM cash_registers WHERE status = 'abierta' LIMIT 1");
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una sesión de caja abierta actualmente.' });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;
    const initBal = parseFloat(initial_balance) || 0;

    const result = await execute(
      `INSERT INTO cash_registers (opened_by_user_id, opened_at, initial_balance, expected_balance, actual_balance, difference, status, notes)
       VALUES (?, ?, ?, ?, ?, 0, 'abierta', ?)`,
      [userId, now, initBal, initBal, initBal, notes ? notes.trim() : null]
    );

    const newId = Number(result.lastInsertRowid);

    await logAudit({
      userId,
      action: 'OPEN_CASH_REGISTER',
      entityType: 'cash_registers',
      entityId: newId,
      newValues: { initial_balance: initBal },
      req,
    });

    return res.status(201).json({ message: 'Caja abierta con éxito.', sessionId: newId });
  } catch (err) {
    console.error('Error al abrir caja:', err);
    return res.status(500).json({ error: 'Error al realizar apertura de caja.' });
  }
}

export async function closeCashSession(req, res) {
  try {
    const { actual_balance, notes } = req.body;

    const current = await queryOne("SELECT * FROM cash_registers WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
    if (!current) {
      return res.status(400).json({ error: 'No hay ninguna sesión de caja abierta para cerrar.' });
    }

    const actual = parseFloat(actual_balance);
    if (isNaN(actual)) {
      return res.status(400).json({ error: 'Debe ingresar el saldo real verificado durante el arqueo.' });
    }

    // Calcular esperado
    const summary = await queryOne(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_in,
         COALESCE(SUM(CASE WHEN type = 'egreso' THEN amount ELSE 0 END), 0) as total_out
       FROM cash_movements WHERE register_id = ?`,
      [current.id]
    );

    const expected = current.initial_balance + (summary?.total_in || 0) - (summary?.total_out || 0);
    const diff = actual - expected;
    const now = new Date().toISOString();
    const userId = req.user.id;

    await execute(
      `UPDATE cash_registers SET
         closed_by_user_id = ?, closed_at = ?, expected_balance = ?,
         actual_balance = ?, difference = ?, status = 'cerrada', notes = ?
       WHERE id = ?`,
      [userId, now, expected, actual, diff, notes || null, current.id]
    );

    await logAudit({
      userId,
      action: 'CLOSE_CASH_REGISTER',
      entityType: 'cash_registers',
      entityId: current.id,
      newValues: { expected, actual, difference: diff },
      req,
    });

    return res.json({
      message: 'Caja cerrada y arqueo completado correctamente.',
      expected_balance: expected,
      actual_balance: actual,
      difference: diff,
    });
  } catch (err) {
    console.error('Error al cerrar caja:', err);
    return res.status(500).json({ error: 'Error al realizar cierre de caja.' });
  }
}

export async function addCashMovement(req, res) {
  try {
    const { type, category, description, amount, payment_method = 'efectivo', notes } = req.body;

    const current = await queryOne("SELECT id FROM cash_registers WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
    if (!current) {
      return res.status(400).json({ error: 'No hay una caja abierta para registrar movimientos de dinero.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'El importe debe ser mayor a cero.' });
    }

    const now = new Date().toISOString();
    const userId = req.user.id;

    const result = await execute(
      `INSERT INTO cash_movements (register_id, type, category, description, amount, payment_method, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [current.id, type, category || 'movimiento_general', description.trim(), parsedAmount, payment_method, userId, now]
    );

    // Si es gasto o ingreso operativo manual, registrar también en movimientos financieros generales
    await execute(
      `INSERT INTO financial_movements (date, type, category, description, amount, payment_method, notes, created_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [now.split('T')[0], type, category || 'Caja', description.trim(), parsedAmount, payment_method, notes || null, userId, now]
    );

    return res.status(201).json({ message: 'Movimiento de caja registrado exitosamente.' });
  } catch (err) {
    console.error('Error al agregar movimiento de caja:', err);
    return res.status(500).json({ error: 'Error al registrar movimiento en caja.' });
  }
}
