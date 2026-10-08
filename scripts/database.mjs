export { createDatabasePool } from './pool.mjs';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function migrateDatabase(pool) {
  const directory = fileURLToPath(new URL('../db/migrations/', import.meta.url));
  const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Only one application instance can create or migrate the schema at a time.
    await client.query('SELECT pg_advisory_xact_lock(20261008, 150122)');
    await client.query('CREATE TABLE IF NOT EXISTS kb_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const applied = await client.query('SELECT checksum FROM kb_schema_migrations WHERE name=$1', [name]);
      if (applied.rows.length) {
        if (applied.rows[0].checksum !== checksum) throw new Error('Применённая миграция была изменена: ' + name);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO kb_schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
