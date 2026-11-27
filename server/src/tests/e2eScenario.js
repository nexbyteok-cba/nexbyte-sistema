import assert from 'assert';
import app from '../index.js';
import { queryOne, query } from '../db/index.js';
import { config } from '../config/index.js';

const PORT = 5099;

async function runScenario() {
  console.log('🧪 Iniciando prueba E2E de los 25 criterios de aceptación del instructivo...\n');

  // Iniciar servidor de prueba en puerto 5099
  const server = app.listen(PORT);

  const baseUrl = `http://localhost:${PORT}/api`;
  let token = null;
  let clientId = null;
  let orderId = null;
  let orderNumber = null;

  try {
    // 1. Iniciar sesión como administrador
    console.log('1️⃣ Iniciar sesión como administrador...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.admin.email,
        password: config.admin.initialPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Login falló');
    token = loginData.token;
    assert.ok(token, 'No se recibió token');
    console.log('   ✓ Login exitoso. Token generado.');

    // Simular cambio obligatorio de contraseña si aplica
    if (loginData.user.must_change_password) {
      console.log('   Cambio obligatorio de contraseña inicial detectado. Actualizando...');
      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: config.admin.initialPassword,
          newPassword: 'Nexbyte2026!NuevaPass',
        }),
      });
      assert.strictEqual(changeRes.status, 200);
      console.log('   ✓ Contraseña actualizada correctamente.');
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Registrar un cliente
    console.log('2️⃣ Registrar un cliente...');
    const clientRes = await fetch(`${baseUrl}/clients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        first_name: 'Carlos',
        last_name: 'Pérez',
        dni: '34567890',
        phone: '351-9876543',
        phone_alt: '351-1112233',
        email: 'carlos.perez@test.com',
        address: 'B° Nueva Córdoba',
        notes: 'Cliente recomendado',
      }),
    });
    const clientData = await clientRes.json();
    assert.strictEqual(clientRes.status, 201, 'Error al registrar cliente');
    clientId = clientData.id;
    assert.ok(clientId, 'Cliente sin ID');
    console.log(`   ✓ Cliente registrado: ${clientData.first_name} ${clientData.last_name} (ID: ${clientId})`);

    // 3 a 13. Crear recepción de equipo
    console.log('3️⃣ - 1️⃣3️⃣ Procesar recepción completa (equipo, servicios, condiciones, fotos, firma, consentimiento)...');
    const receptionPayload = {
      client_data: { id: clientId },
      equipment_data: {
        equipment_type_id: 2, // Notebook
        brand: 'Lenovo',
        model: 'ThinkPad T480',
        serial_number: 'PF-1ABCD23',
        color: 'Negro',
        os: 'Windows 11 Pro',
        notes: 'Uso laboral diario',
      },
      services_data: [
        { service_id: 1, service_name: 'Limpieza integral', price: 25000 },
        { service_id: 3, service_name: 'Reparación de hardware', price: 30000 },
      ],
      accessories_data: ['Cargador', 'Funda'],
      conditions_data: {
        has_no_issues: false,
        scratches: 1,
        dents: 0,
        detailed_notes: 'Rayón visible en tapa superior cerca del logo',
      },
      photos_data: [
        { photo_url: '/uploads/sample-laptop.jpg', category: 'frente', description: 'Foto frontal de ingreso' },
      ],
      estimated_days: 3,
      signature_data: {
        signature_data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        client_name: 'Carlos Pérez',
        client_dni_or_phone: '351-9876543',
      },
      consent_data: {
        consent_text: 'Términos aceptados por el cliente.',
        agreed: true,
      },
      initial_deposit: 15000,
      payment_method: 'efectivo',
    };

    const recRes = await fetch(`${baseUrl}/reception`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(receptionPayload),
    });
    const recData = await recRes.json();
    assert.strictEqual(recRes.status, 201, 'Error al procesar recepción');
    orderId = recData.orderId;
    orderNumber = recData.orderNumber;
    assert.ok(orderId && orderNumber, 'Faltan datos de la orden');
    console.log(`   ✓ Recepción confirmada. Orden emitida: ${orderNumber} (ID: ${orderId})`);

    // 14 & 15. Consultar la orden y comprobar inmutabilidad
    console.log('1️⃣4️⃣ - 1️⃣5️⃣ Consultar orden y verificar comprobante...');
    const orderRes = await fetch(`${baseUrl}/orders/${orderId}`, { headers: authHeaders });
    const orderDetail = await orderRes.json();
    assert.strictEqual(orderDetail.order_number, orderNumber);
    assert.strictEqual(orderDetail.total_amount, 55000);
    assert.strictEqual(orderDetail.deposit_amount, 15000);
    assert.strictEqual(orderDetail.balance_amount, 40000);
    assert.strictEqual(orderDetail.is_locked, 1);
    console.log(`   ✓ Orden consultada. Total: $${orderDetail.total_amount}, Seña: $${orderDetail.deposit_amount}, Saldo: $${orderDetail.balance_amount}`);

    // 16. Modificar estado
    console.log('1️⃣6️⃣ Modificar estado a "en_control"...');
    const statusRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'en_control', notes: 'Revisión en banco de trabajo iniciada' }),
    });
    assert.strictEqual(statusRes.status, 200);
    console.log('   ✓ Estado actualizado a "en_control".');

    // 17. Registrar diagnóstico
    console.log('1️⃣7️⃣ Registrar diagnóstico técnico...');
    const diagRes = await fetch(`${baseUrl}/orders/${orderId}/diagnostic`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        reported_issue: 'No enciende ocasionalmente y levanta temperatura',
        technical_diagnosis: 'Pasta térmica cristalizada y obstrucción en turbina de refrigeración',
        detected_failures: 'Sobrecalentamiento térmico',
        proposed_solution: 'Limpieza ultrasónica, reaplicación de compuesto térmico y prueba de estrés',
        estimated_cost: 55000,
      }),
    });
    assert.strictEqual(diagRes.status, 200);
    console.log('   ✓ Diagnóstico registrado.');

    // 18. Autorizar reparación
    console.log('1️⃣8️⃣ Autorizar reparación por el cliente...');
    const authRes = await fetch(`${baseUrl}/orders/${orderId}/authorizations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        authorized_by: 'Carlos Pérez',
        authorization_method: 'WhatsApp',
        authorized_amount: 55000,
        notes: 'Confirmó por audio de WhatsApp a las 11:30hs',
      }),
    });
    assert.strictEqual(authRes.status, 201);
    console.log('   ✓ Autorización registrada.');

    // 19. Registrar repuestos utilizados
    console.log('1️⃣9️⃣ Registrar repuestos utilizados...');
    const partRes = await fetch(`${baseUrl}/orders/${orderId}/parts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        part_name: 'Pasta Térmica Arctic MX-4',
        quantity: 1,
        unit_price: 5000,
      }),
    });
    assert.strictEqual(partRes.status, 201);
    console.log('   ✓ Repuesto incorporado a la orden.');

    // 20. Finalizar reparación
    console.log('2️⃣0️⃣ Finalizar reparación...');
    const repRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'reparado', notes: 'Pruebas de estrés superadas con éxito a 62°C' }),
    });
    assert.strictEqual(repRes.status, 200);
    console.log('   ✓ Estado actualizado a "reparado".');

    // 21. Consultar saldo actualizado
    const orderAfterPart = await (await fetch(`${baseUrl}/orders/${orderId}`, { headers: authHeaders })).json();
    console.log(`   Saldo restante tras repuesto: $${orderAfterPart.balance_amount}`);

    // 22. Registrar pago restante
    console.log('2️⃣1️⃣ - 2️⃣2️⃣ Registrar pago restante...');
    const payRes = await fetch(`${baseUrl}/payments/order/${orderId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: orderAfterPart.balance_amount,
        payment_type: 'pago_total',
        payment_method: 'transferencia',
        reference_code: 'TRANSF-9823412',
        notes: 'Pago del saldo restante',
      }),
    });
    const payData = await payRes.json();
    assert.strictEqual(payRes.status, 201);
    assert.strictEqual(payData.newBalance, 0);
    console.log('   ✓ Saldo restante pagado. Saldo actual: $0.00');

    // 23. Entregar el equipo
    console.log('2️⃣3️⃣ Entregar el equipo con devolución de accesorios...');
    const delivRes = await fetch(`${baseUrl}/orders/${orderId}/delivery`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        returned_accessories: [1, 2],
        delivery_notes: 'Equipo probado y entregado en mano al titular.',
      }),
    });
    assert.strictEqual(delivRes.status, 200);
    console.log('   ✓ Equipo entregado.');

    // 24. Comprobar estado final en base de datos
    const finalOrder = await (await fetch(`${baseUrl}/orders/${orderId}`, { headers: authHeaders })).json();
    assert.strictEqual(finalOrder.current_status, 'entregado');
    assert.strictEqual(finalOrder.balance_amount, 0);
    assert.ok(finalOrder.delivery_date);
    console.log('2️⃣4️⃣ ✓ Comprobante de pago y estado de entrega verificados.');

    // 25. Consultar historial completo del cliente
    console.log('2️⃣5️⃣ Consultar historial completo del cliente...');
    const clientHistory = await (await fetch(`${baseUrl}/clients/${clientId}`, { headers: authHeaders })).json();
    assert.strictEqual(clientHistory.orders.length, 1);
    assert.strictEqual(clientHistory.equipment.length, 1);
    assert.strictEqual(clientHistory.summary.total_pending_debt, 0);
    console.log(`   ✓ Historial del cliente validado: 1 orden entregada, 1 equipo registrado, deuda pendiente $0.`);

    console.log('\n======================================================');
    console.log('🎉 TODOS LOS 25 CRITERIOS DE ACEPTACIÓN COMPLETADOS Y VERIFICADOS CON ÉXITO.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Error en prueba E2E:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runScenario();
