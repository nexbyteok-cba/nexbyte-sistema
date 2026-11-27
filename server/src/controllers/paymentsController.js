import { query, queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function getOrderPayments(req, res) {
  try {
    const { orderId } = req.params;
    const payments = await query(
      `SELECT p.*, u.full_name as received_by_name
       FROM payments p
       LEFT JOIN users u ON p.received_by_user_id = u.id
       WHERE p.order_id = ? ORDER BY p.id ASC`,
      [orderId]
    );
    return res.json(payments);
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    return res.status(500).json({ error: 'Error al consultar pagos de la orden.' });
  }
}

export async function createPayment(req, res) {
  try {
    const { orderId } = req.params;
    const {
      amount,
      payment_type, // 'seña', 'pago_parcial', 'pago_total', 'devolucion'
      payment_method, // 'efectivo', 'transferencia', 'mercado_pago', 'tarjeta', 'otro'
      reference_code,
      notes,
    } = req.body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'El importe del pago debe ser mayor a cero.' });
    }

    const order = await queryOne('SELECT * FROM service_orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Regla 9: No permitir registrar saldo negativo por error de carga
    if (payment_type !== 'devolucion') {
      if (paymentAmount > order.balance_amount) {
        return res.status(400).json({
          error: `El importe ($${paymentAmount.toFixed(2)}) supera el saldo pendiente de la orden ($${order.balance_amount.toFixed(2)}).`,
        });
      }
    }

    const now = new Date().toISOString();
    const userId = req.user.id;

    // Verificar si hay caja abierta para registrar el movimiento en efectivo
    let cashMovementId = null;
    const activeCash = await queryOne("SELECT id FROM cash_registers WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
    if (activeCash && payment_method === 'efectivo') {
      const isDevolucion = payment_type === 'devolucion';
      const cType = isDevolucion ? 'egreso' : 'ingreso';
      const cDesc = isDevolucion
        ? `Devolución de orden ${order.order_number}`
        : `Cobro de ${payment_type} orden ${order.order_number}`;

      const cashRes = await execute(
        `INSERT INTO cash_movements (register_id, type, category, description, amount, payment_method, reference_type, reference_id, user_id, created_at)
         VALUES (?, ?, 'pago_orden', ?, ?, ?, 'orden_trabajo', ?, ?, ?)`,
        [activeCash.id, cType, cDesc, paymentAmount, payment_method, orderId, userId, now]
      );
      cashMovementId = Number(cashRes.lastInsertRowid);
    }

    // Insertar registro de pago
    const payRes = await execute(
      `INSERT INTO payments (order_id, amount, payment_type, payment_method, reference_code, notes, cash_movement_id, received_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        paymentAmount,
        payment_type,
        payment_method,
        reference_code ? reference_code.trim() : null,
        notes ? notes.trim() : null,
        cashMovementId,
        userId,
        now,
      ]
    );

    const paymentId = Number(payRes.lastInsertRowid);

    // Actualizar montos en la orden
    let newPaidAmount = order.paid_amount;
    let newBalance = order.balance_amount;

    if (payment_type === 'devolucion') {
      newPaidAmount = Math.max(0, newPaidAmount - paymentAmount);
      newBalance = Math.min(order.total_amount, newBalance + paymentAmount);
    } else {
      newPaidAmount = newPaidAmount + paymentAmount;
      newBalance = Math.max(0, order.total_amount - newPaidAmount);
    }

    await execute(
      'UPDATE service_orders SET paid_amount = ?, balance_amount = ?, updated_at = ? WHERE id = ?',
      [newPaidAmount, newBalance, now, orderId]
    );

    // Asentar en movimientos financieros generales
    await execute(
      `INSERT INTO financial_movements (date, type, category, description, amount, payment_method, reference_code, order_id, notes, created_by_user_id, created_at)
       VALUES (?, ?, 'Cobros de Servicios', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        now.split('T')[0],
        payment_type === 'devolucion' ? 'egreso' : 'ingreso',
        `Pago recibido para orden ${order.order_number}`,
        paymentAmount,
        payment_method,
        reference_code || `PAGO-${order.order_number}`,
        orderId,
        notes || null,
        userId,
        now,
      ]
    );

    await logAudit({
      userId,
      action: 'RECORD_PAYMENT',
      entityType: 'payments',
      entityId: paymentId,
      newValues: { orderId, paymentAmount, payment_type, payment_method, newBalance },
      req,
    });

    return res.status(201).json({
      message: 'Pago asentado correctamente.',
      paymentId,
      newPaidAmount,
      newBalance,
    });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    return res.status(500).json({ error: 'Error al procesar el pago de la orden.' });
  }
}
