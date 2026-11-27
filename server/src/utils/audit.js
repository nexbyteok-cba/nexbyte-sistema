import { execute } from '../db/index.js';

export async function logAudit({ userId, action, entityType, entityId, oldValues = null, newValues = null, req = null }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entityType,
        entityId ? String(entityId) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        now,
      ]
    );
  } catch (err) {
    console.error('Error al guardar log de auditoría:', err.message);
  }
}
