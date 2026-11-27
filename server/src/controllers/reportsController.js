import { query, queryOne } from '../db/index.js';

export async function getDashboardOverview(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentYearMonth = today.substring(0, 7);

    // 1. Contadores principales de órdenes (Mosaicos / Tiles)
    const [
      ordersInRepair,
      ordersPendingDiagnostic,
      ordersReadyToDeliver,
      ordersPendingDeliveryWithDebt,
      todayAppointments,
      totalClients,
      monthlyFinance,
      criticalStockCount,
      recentActivity,
    ] = await Promise.all([
      // Equipos actualmente en reparación
      queryOne("SELECT COUNT(*) as count FROM service_orders WHERE current_status = 'en_reparacion'"),
      // Equipos pendientes de diagnóstico
      queryOne("SELECT COUNT(*) as count FROM service_orders WHERE current_status IN ('recibido', 'pendiente_diagnostico', 'en_control')"),
      // Equipos listos para retirar (reparado o listo_para_entregar)
      queryOne("SELECT COUNT(*) as count FROM service_orders WHERE current_status IN ('reparado', 'listo_para_entregar')"),
      // Equipos entregados o pendientes de entrega
      queryOne("SELECT COUNT(*) as count FROM service_orders WHERE current_status = 'entregado'"),
      // Turnos del día
      queryOne('SELECT COUNT(*) as count FROM appointments WHERE date = ?', [today]),
      // Clientes registrados
      queryOne('SELECT COUNT(*) as count FROM clients WHERE is_active = 1'),
      // Finanzas del mes (Ingresos y egresos efectivos)
      queryOne(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as monthly_income,
           COALESCE(SUM(CASE WHEN type = 'egreso' THEN amount ELSE 0 END), 0) as monthly_expense
         FROM financial_movements
         WHERE date LIKE ?`,
        [`${currentYearMonth}%`]
      ),
      // Artículos con stock crítico
      queryOne('SELECT COUNT(*) as count FROM inventory_items WHERE is_active = 1 AND quantity <= min_stock'),
      // Actividad reciente (Últimos estados de órdenes)
      query(
        `SELECT h.*, o.order_number, u.full_name as user_name
         FROM order_status_history h
         JOIN service_orders o ON h.order_id = o.id
         LEFT JOIN users u ON h.changed_by_user_id = u.id
         ORDER BY h.id DESC LIMIT 8`
      ),
    ]);

    // Deudas pendientes totales
    const debtSummary = await queryOne('SELECT COALESCE(SUM(balance_amount), 0) as total_debt FROM service_orders WHERE balance_amount > 0');

    // Turnos próximos pendientes
    const upcomingAppointments = await query(
      `SELECT * FROM appointments 
       WHERE date >= ? AND status = 'pendiente' 
       ORDER BY date ASC, time ASC LIMIT 5`,
      [today]
    );

    const monthlyIncome = monthlyFinance?.monthly_income || 0;
    const monthlyExpense = monthlyFinance?.monthly_expense || 0;
    const estimatedProfit = monthlyIncome - monthlyExpense;

    return res.json({
      tiles: {
        in_repair: ordersInRepair?.count || 0,
        pending_diagnostic: ordersPendingDiagnostic?.count || 0,
        ready_for_pickup: ordersReadyToDeliver?.count || 0,
        delivered: ordersPendingDeliveryWithDebt?.count || 0,
        today_appointments: todayAppointments?.count || 0,
        total_clients: totalClients?.count || 0,
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        estimated_profit: estimatedProfit,
        low_stock_items: criticalStockCount?.count || 0,
        total_pending_debt: debtSummary?.total_debt || 0,
      },
      recent_activity: recentActivity,
      upcoming_appointments: upcomingAppointments,
    });
  } catch (err) {
    console.error('Error al generar overview del dashboard:', err);
    return res.status(500).json({ error: 'Error al consultar indicadores del sistema.' });
  }
}

export async function getDetailedReports(req, res) {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    let dateParams = [];

    if (from && to) {
      dateFilter = ' AND reception_date BETWEEN ? AND ?';
      dateParams = [from, to];
    }

    // 1. Equipos recibidos por tipo
    const equipmentByType = await query(
      `SELECT et.name, COUNT(o.id) as count
       FROM service_orders o
       JOIN equipment e ON o.equipment_id = e.id
       JOIN equipment_types et ON e.equipment_type_id = et.id
       WHERE 1=1 ${dateFilter}
       GROUP BY et.id, et.name`,
      dateParams
    );

    // 2. Servicios más solicitados
    const topServices = await query(
      `SELECT os.service_name, COUNT(os.id) as count, SUM(os.price) as total_revenue
       FROM order_services os
       JOIN service_orders o ON os.order_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY os.service_name
       ORDER BY count DESC LIMIT 8`,
      dateParams
    );

    // 3. Distribución por estados de órdenes
    const ordersByStatus = await query(
      `SELECT current_status, COUNT(id) as count
       FROM service_orders
       WHERE 1=1 ${dateFilter}
       GROUP BY current_status`,
      dateParams
    );

    // 4. Clientes más frecuentes
    const topClients = await query(
      `SELECT c.id, c.first_name, c.last_name, c.phone, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent
       FROM clients c
       JOIN service_orders o ON c.id = o.client_id
       WHERE 1=1 ${dateFilter}
       GROUP BY c.id
       ORDER BY total_orders DESC LIMIT 10`,
      dateParams
    );

    // 5. Ingresos y egresos mensuales (últimos 6 meses)
    const monthlyFlow = await query(
      `SELECT SUBSTR(date, 1, 7) as month,
              COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as income,
              COALESCE(SUM(CASE WHEN type = 'egreso' THEN amount ELSE 0 END), 0) as expense
       FROM financial_movements
       GROUP BY SUBSTR(date, 1, 7)
       ORDER BY month DESC LIMIT 6`
    );

    return res.json({
      equipmentByType,
      topServices,
      ordersByStatus,
      topClients,
      monthlyFlow: monthlyFlow.reverse(),
    });
  } catch (err) {
    console.error('Error al generar reportes detallados:', err);
    return res.status(500).json({ error: 'Error al generar estadísticas y reportes.' });
  }
}
