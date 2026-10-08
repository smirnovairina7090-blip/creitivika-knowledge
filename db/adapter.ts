// Preserve the existing parameterized query interface while using PostgreSQL.
export function postgresQuery(sql: string) {
  let index = 0;
  let quoted = false;
  let result = '';
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") {
      if (quoted && sql[i + 1] === "'") { result += "''"; i++; continue; }
      quoted = !quoted;
    }
    result += char === '?' && !quoted ? '$' + ++index : char;
  }
  return result;
}
type QueryResult = { rows: Record<string, unknown>[]; rowCount?: number | null; affectedRows?: number };
type Client = { query: (sql: string, params?: unknown[]) => Promise<QueryResult>; release: () => void };
export type Pool = { query: Client['query']; connect: () => Promise<Client> };
class Statement {
  constructor(public sql: string, private pool: Pool, public params: unknown[] = []) {}
  bind(...params: unknown[]) { return new Statement(this.sql, this.pool, params); }
  async all<T>() { const result = await this.pool.query(this.sql, this.params); return { results: result.rows as T[] }; }
  async first<T>() { const result = await this.all<T>(); return result.results[0] ?? null; }
  async run() { const result = await this.pool.query(this.sql, this.params); return { meta: { changes: result.rowCount ?? result.affectedRows ?? 0 } }; }
}
export class Database {
  constructor(private pool: Pool) {}
  prepare(sql: string) { return new Statement(postgresQuery(sql), this.pool); }
  async batch(statements: Statement[]) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const statement of statements) results.push(await client.query(statement.sql, statement.params));
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
