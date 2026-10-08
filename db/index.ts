import { createDatabasePool } from '../scripts/pool.mjs';
import { Database, type Pool } from './adapter';
let database: Database | undefined;
export function getRawDb() {
  database ??= new Database(createDatabasePool() as unknown as Pool);
  return database;
}
