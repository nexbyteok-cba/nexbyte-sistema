import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client;

export function getDb() {
  if (!client) {
    if (config.turso.url && config.turso.authToken) {
      client = createClient({
        url: config.turso.url,
        authToken: config.turso.authToken,
      });
      console.log('🔗 Conectado a Turso Cloud Database');
    } else {
      const dbPath = path.resolve(__dirname, '../../nexbyte.db');
      client = createClient({
        url: `file:${dbPath}`,
      });
      console.log(`📁 Conectado a base de datos libSQL local: ${dbPath}`);
    }
  }
  return client;
}

export async function query(sql, args = []) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows;
}

export async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql, args = []) {
  const db = getDb();
  return await db.execute({ sql, args });
}

export async function batch(statements) {
  const db = getDb();
  return await db.batch(statements);
}

export default {
  getDb,
  query,
  queryOne,
  execute,
  batch,
};
