import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🚀 Iniciando migraciones de base de datos...');
  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Dividir sentencias cuidando bloques
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error) {
      console.error(`Error ejecutando sentencia SQL: ${statement.substring(0, 50)}...`, error.message);
      throw error;
    }
  }

  console.log(`✅ Migraciones aplicadas con éxito (${statements.length} sentencias).`);
}

// Ejecutar directamente si se llama via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en migración:', err);
      process.exit(1);
    });
}
