import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getFinancialMovements(req, res) {
  try {
    const { from, to, type, category } = req.query;
    let sql = `
      SELECT f.*, u.full_name as created_by_name, o.order_number
      FROM financial_movements f
      LEFT JOIN users u ON f.created_by_user_id = u.id
      LEFT JOIN service_orders o ON f.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      sql += ' AND f.date BETWEEN ? AND ?';
      params.push(from, to);
    }

    if (type && type !== 'todos') {
      sql += ' AND f.type = ?';
      params.push(type);
    }

    if (category && category !== 'todas') {
      sql += ' AND f.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY f.date DESC, f.id DESC';
    const movements = await query(sql, params);

    // Totales calculados
    let totalIncome = 0;
    let totalExpense = 0;

    movements.forEach((m) => {
      if (m.type === 'ingreso') totalIncome += m.amount;
      else if (m.type === 'egreso') totalExpense += m.amount;
    });

    return res.json({
      movements,
      summary: {
        totalIncome,
        totalExpense,
        netResult: totalIncome - totalExpense,
      },
    });
  } catch (err) {
    console.error('Error al obtener movimientos financieros:', err);
    return res.status(500).json({ error: 'Error al consultar movimientos financieros.' });
  }
}

export async function createFinancialMovement(req, res) {
  try {
    const { date, type, category, description, amount, payment_method, reference_code, notes } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!description || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Descripción e importe válido son obligatorios.' });
    }

    const now = new Date().toISOString();
    const movDate = date || now.split('T')[0];
    const userId = req.user.id;

    const result = await execute(
      `INSERT INTO financial_movements (date, type, category, description, amount, payment_method, reference_code, notes, created_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movDate,
        type || 'ingreso',
        category || 'General',
        description.trim(),
        parsedAmount,
        payment_method || 'efectivo',
        reference_code || null,
        notes || null,
        userId,
        now,
      ]
    );

    const newId = Number(result.lastInsertRowid);

    await logAudit({
      userId,
      action: 'CREATE_FINANCIAL_MOVEMENT',
      entityType: 'financial_movements',
      entityId: newId,
      newValues: { type, category, amount: parsedAmount },
      req,
    });

    return res.status(201).json({ message: 'Movimiento financiero asentado correctamente.', id: newId });
  } catch (err) {
    console.error('Error al registrar movimiento financiero:', err);
    return res.status(500).json({ error: 'Error al registrar movimiento financiero.' });
  }
}
