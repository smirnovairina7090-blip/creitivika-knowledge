import { Pool } from 'pg';

export function createDatabasePool() {
  if (!process.env.DATABASE_URL) throw new Error('Не настроено подключение к базе: DATABASE_URL.');
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
}
