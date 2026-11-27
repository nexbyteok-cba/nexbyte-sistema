import { query, queryOne, execute, batch } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

// Generar identificador único NB-YYYY-XXXXX
export async function generateNextOrderNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `NB-${currentYear}-`;

  const lastOrder = await queryOne(
    `SELECT order_number FROM service_orders 
     WHERE order_number LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (lastOrder && lastOrder.order_number) {
    const parts = lastOrder.order_number.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(5, '0')}`;
}

export async function getNextOrderNumberHandler(req, res) {
  try {
    const nextNumber = await generateNextOrderNumber();
    return res.json({ nextOrderNumber: nextNumber });
  } catch (err) {
    console.error('Error generando próximo número de orden:', err);
    return res.status(500).json({ error: 'Error al generar número de comprobante.' });
  }
}

export async function processReception(req, res) {
  try {
    const {
      client_data, // { id } o { first_name, last_name, phone, phone_alt, email, address, dni }
      equipment_data, // { id } o { equipment_type_id, brand, model, serial_number, color, os, notes }
      services_data, // Array de { service_id, service_name, price, notes }
      accessories_data, // Array de strings o { name, received, notes }
      conditions_data, // { has_no_issues, general_condition, scratches, dents, cracks, damaged_screen, damaged_hinges, missing_screws, missing_components, damaged_ports, previous_tampering, dirtiness, visible_humidity, other_details, detailed_notes }
      photos_data, // Array de { photo_url, public_id, category, description }
      estimated_days = 3,
      signature_data, // { signature_data_url, client_name, client_dni_or_phone }
      consent_data, // { consent_text, agreed }
      initial_deposit = 0,
      payment_method = 'efectivo',
      appointment_id = null,
      observations = null,
    } = req.body;

    const now = new Date().toISOString();
    const technicianId = req.user.id;

    // 1. Validar o crear Cliente
    let clientId = client_data?.id;
    if (!clientId) {
      if (!client_data?.first_name || !client_data?.last_name || !client_data?.phone) {
        return res.status(400).json({ error: 'Datos de cliente incompletos (nombre, apellido y teléfono obligatorios).' });
      }

      // Check duplicados
      const cleanPhone = client_data.phone.trim();
      const cleanEmail = client_data.email ? client_data.email.trim().toLowerCase() : null;
      let dupSql = 'SELECT id FROM clients WHERE is_active = 1 AND phone = ?';
      let dupParams = [cleanPhone];
      if (cleanEmail) {
        dupSql += ' OR email = ?';
        dupParams.push(cleanEmail);
      }
      const existing = await queryOne(dupSql, dupParams);
      if (existing) {
        clientId = existing.id;
      } else {
        const clientRes = await execute(
          `INSERT INTO clients (first_name, last_name, dni, phone, phone_alt, email, address, notes, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            client_data.first_name.trim(),
            client_data.last_name.trim(),
            client_data.dni ? client_data.dni.trim() : null,
            cleanPhone,
            client_data.phone_alt ? client_data.phone_alt.trim() : null,
            cleanEmail,
            client_data.address ? client_data.address.trim() : null,
            client_data.notes ? client_data.notes.trim() : null,
            now,
            now,
          ]
        );
        clientId = Number(clientRes.lastInsertRowid);
      }
    }

    // 2. Validar o registrar Equipo
    let equipmentId = equipment_data?.id;
    if (!equipmentId) {
      if (!equipment_data?.equipment_type_id || !equipment_data?.brand || !equipment_data?.model) {
        return res.status(400).json({ error: 'Datos de equipo incompletos (tipo, marca y modelo obligatorios).' });
      }

      const eqRes = await execute(
        `INSERT INTO equipment (client_id, equipment_type_id, brand, model, serial_number, color, os, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          equipment_data.equipment_type_id,
          equipment_data.brand.trim(),
          equipment_data.model.trim(),
          equipment_data.serial_number ? equipment_data.serial_number.trim() : null,
          equipment_data.color ? equipment_data.color.trim() : null,
          equipment_data.os ? equipment_data.os.trim() : null,
          equipment_data.notes ? equipment_data.notes.trim() : null,
          now,
          now,
        ]
      );
      equipmentId = Number(eqRes.lastInsertRowid);
    }

    // 3. Validar Condiciones (Regla de incompatibilidad)
    const hasNoIssues = Boolean(conditions_data?.has_no_issues);
    if (hasNoIssues) {
      // Si se marca "sin observaciones", ninguna anomalía física debe ser 1
      if (
        conditions_data.scratches ||
        conditions_data.dents ||
        conditions_data.cracks ||
        conditions_data.damaged_screen ||
        conditions_data.damaged_hinges ||
        conditions_data.missing_screws ||
        conditions_data.missing_components ||
        conditions_data.damaged_ports ||
        conditions_data.previous_tampering ||
        conditions_data.visible_humidity
      ) {
        return res.status(400).json({
          error: 'La opción "El equipo se recibe sin observaciones físicas aparentes" es incompatible con observaciones de daños o fallas físicas.',
        });
      }
    }

    // 4. Validar Firma y Consentimiento (Obligatorios según Sección 7.8 y 7.9)
    if (!signature_data?.signature_data_url) {
      return res.status(400).json({ error: 'La firma electrónica digitalizada del cliente es obligatoria para emitir el comprobante.' });
    }
    if (!consent_data?.agreed) {
      return res.status(400).json({ error: 'El cliente debe aceptar las condiciones y términos de recepción.' });
    }

    // 5. Calcular fechas y montos
    const receptionDate = now;
    const estDays = parseInt(estimated_days, 10) || 3;
    const estDateObj = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000);
    const estimatedCompletionDate = estDateObj.toISOString().split('T')[0];

    let totalAmount = 0;
    if (Array.isArray(services_data)) {
      totalAmount = services_data.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
    }

    const deposit = Math.max(0, parseFloat(initial_deposit) || 0);
    const balance = Math.max(0, totalAmount - deposit);

    // 6. Generar número único de comprobante garantizado
    const orderNumber = await generateNextOrderNumber();

    // 7. Insertar Orden de Servicio Bloqueada (Inviolable)
    const orderRes = await execute(
      `INSERT INTO service_orders (
         order_number, client_id, equipment_id, technician_id,
         reception_date, estimated_days, estimated_completion_date,
         current_status, total_amount, deposit_amount, paid_amount,
         balance_amount, observations, is_locked, locked_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'recibido', ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        orderNumber,
        clientId,
        equipmentId,
        technicianId,
        receptionDate,
        estDays,
        estimatedCompletionDate,
        totalAmount,
        deposit,
        deposit, // paid_amount inicial
        balance,
        observations || null,
        now, // locked_at
        now,
        now,
      ]
    );

    const orderId = Number(orderRes.lastInsertRowid);

    // 8. Insertar Servicios
    if (Array.isArray(services_data) && services_data.length > 0) {
      for (const serv of services_data) {
        await execute(
          `INSERT INTO order_services (order_id, service_id, service_name, price, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, serv.service_id || null, serv.service_name, parseFloat(serv.price) || 0, serv.notes || null]
        );
      }
    }

    // 9. Insertar Accesorios
    if (Array.isArray(accessories_data) && accessories_data.length > 0) {
      for (const acc of accessories_data) {
        const accName = typeof acc === 'string' ? acc : acc.name;
        const accNotes = typeof acc === 'object' ? acc.notes : null;
        if (accName && accName.trim()) {
          await execute(
            `INSERT INTO order_accessories (order_id, name, received, returned, notes)
             VALUES (?, ?, 1, 0, ?)`,
            [orderId, accName.trim(), accNotes]
          );
        }
      }
    }

    // 10. Insertar Condiciones de recepción
    await execute(
      `INSERT INTO order_conditions (
         order_id, has_no_issues, general_condition, scratches, dents, cracks,
         damaged_screen, damaged_hinges, missing_screws, missing_components,
         damaged_ports, previous_tampering, dirtiness, visible_humidity,
         other_details, detailed_notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        hasNoIssues ? 1 : 0,
        conditions_data?.general_condition || (hasNoIssues ? 'Excelente / Sin observaciones' : 'Regular'),
        conditions_data?.scratches ? 1 : 0,
        conditions_data?.dents ? 1 : 0,
        conditions_data?.cracks ? 1 : 0,
        conditions_data?.damaged_screen ? 1 : 0,
        conditions_data?.damaged_hinges ? 1 : 0,
        conditions_data?.missing_screws ? 1 : 0,
        conditions_data?.missing_components ? 1 : 0,
        conditions_data?.damaged_ports ? 1 : 0,
        conditions_data?.previous_tampering ? 1 : 0,
        conditions_data?.dirtiness ? 1 : 0,
        conditions_data?.visible_humidity ? 1 : 0,
        conditions_data?.other_details || null,
        conditions_data?.detailed_notes || null,
      ]
    );

    // 11. Insertar Fotografías
    if (Array.isArray(photos_data) && photos_data.length > 0) {
      for (const photo of photos_data) {
        if (photo.photo_url) {
          await execute(
            `INSERT INTO order_photos (order_id, photo_url, public_id, category, description, uploaded_by_user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderId, photo.photo_url, photo.public_id || null, photo.category || 'frente', photo.description || null, technicianId, now]
          );
        }
      }
    }

    // 12. Insertar Firma y Consentimiento
    await execute(
      `INSERT INTO order_signatures (order_id, signature_data_url, client_name, client_dni_or_phone, consent_version, signed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        signature_data.signature_data_url,
        signature_data.client_name || `${client_data?.first_name || ''} ${client_data?.last_name || ''}`.trim(),
        signature_data.client_dni_or_phone || client_data?.phone || 'N/A',
        consent_data?.version || '1.0',
        now,
      ]
    );

    await execute(
      `INSERT INTO order_consents (order_id, consent_text, agreed, agreed_at)
       VALUES (?, ?, 1, ?)`,
      [orderId, consent_data?.consent_text || 'Condiciones generales de servicio aceptadas.', now]
    );

    // 13. Registrar Primer Estado en Historial
    await execute(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, notes, changed_by_user_id, created_at)
       VALUES (?, NULL, 'recibido', 'Recepción de equipo y generación de comprobante de ingreso', ?, ?)`,
      [orderId, technicianId, now]
    );

    // 14. Si hubo Seña Inicial, registrar Pago y Movimiento de Caja / Financiero
    if (deposit > 0) {
      const activeCash = await queryOne("SELECT id FROM cash_registers WHERE status = 'abierta' ORDER BY id DESC LIMIT 1");
      let cashMovementId = null;

      if (activeCash) {
        const cashRes = await execute(
          `INSERT INTO cash_movements (register_id, type, category, description, amount, payment_method, reference_type, reference_id, user_id, created_at)
           VALUES (?, 'ingreso', 'seña', ?, ?, ?, 'orden_trabajo', ?, ?, ?)`,
          [activeCash.id, `Seña recepción orden ${orderNumber}`, deposit, payment_method, orderId, technicianId, now]
        );
        cashMovementId = Number(cashRes.lastInsertRowid);
      }

      await execute(
        `INSERT INTO payments (order_id, amount, payment_type, payment_method, reference_code, notes, cash_movement_id, received_by_user_id, created_at)
         VALUES (?, ?, 'seña', ?, 'RECEPCION-SENA', 'Seña inicial de recepción', ?, ?, ?)`,
        [orderId, deposit, payment_method, cashMovementId, technicianId, now]
      );

      await execute(
        `INSERT INTO financial_movements (date, type, category, description, amount, payment_method, reference_code, order_id, notes, created_by_user_id, created_at)
         VALUES (?, 'ingreso', 'Señas', ?, ?, ?, 'RECEPCION-SENA', ?, 'Seña inicial en comprobante de recepción', ?, ?)`,
        [now.split('T')[0], `Seña recepción ${orderNumber}`, deposit, payment_method, orderId, technicianId, now]
      );
    }

    // 15. Si venía de un turno, actualizarlo
    if (appointment_id) {
      await execute(
        "UPDATE appointments SET status = 'atendido', order_id = ?, updated_at = ? WHERE id = ?",
        [orderId, now, appointment_id]
      );
    }

    // 16. Log de Auditoría
    await logAudit({
      userId: technicianId,
      action: 'PROCESS_RECEPTION',
      entityType: 'service_orders',
      entityId: orderId,
      newValues: { orderNumber, clientId, equipmentId, totalAmount, deposit },
      req,
    });

    return res.status(201).json({
      message: 'Recepción registrada exitosamente con comprobante inmutable generado.',
      orderId,
      orderNumber,
    });
  } catch (err) {
    console.error('Error al procesar recepción:', err);
    return res.status(500).json({ error: 'Error al procesar la recepción del equipo.' });
  }
}
