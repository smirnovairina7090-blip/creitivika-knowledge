import { createDatabasePool, migrateDatabase } from './database.mjs';
const pool = createDatabasePool();
try {
  await migrateDatabase(pool);
  console.log('Таблицы базы готовы.');
} finally {
  await pool.end();
}
