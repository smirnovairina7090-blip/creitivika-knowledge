import { getDatabase } from '@netlify/database';
import { Database, type Pool } from './adapter';
let database: Database | undefined;
export function getRawDb() {
  database ??= new Database(getDatabase().pool as unknown as Pool);
  return database;
}
