/** Minimal query interface shared with the existing D1-backed route handlers. */
export type SqlClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
  release: () => void;
};
export type SqlPool = { connect: () => Promise<SqlClient> };
export interface DatabaseStatement {
  bind(...params: unknown[]): DatabaseStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface Database {
  prepare(sql: string): DatabaseStatement;
  batch(statements: DatabaseStatement[]): Promise<unknown>;
}

/** Converts only the project's fixed SQL dialect; values remain bound parameters. */
export function postgresSql(sql: string) {
  let index = 0;
  let converted = sql.replace(/'(?:(?:'')|[^'])*'|`[^`]*`|\?/g, token => {
    if (token === "?") return `$${++index}`;
    return token.startsWith("`") ? `"${token.slice(1, -1)}"` : token;
  });
  if (/^CREATE TABLE/i.test(converted)) converted = converted.replace(/\binteger\b/gi, "bigint");
  if (/^INSERT OR IGNORE INTO/i.test(converted)) converted = converted.replace(/^INSERT OR IGNORE INTO/i, "INSERT INTO").replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
  return converted.replace("SET count=count+1", "SET count=rate_limits.count+1");
}

const numericColumns = new Set(["seed", "closes_at", "finalized_at", "revision", "score", "achieved_at", "start_at", "submitted_at", "ticks", "at", "rank", "count", "expires_at"]);
function normalizeRows(rows: Record<string, unknown>[]) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (numericColumns.has(key) && (typeof value === "string" || typeof value === "bigint")) {
      const n = Number(value);
      if (!Number.isSafeInteger(n)) throw new Error(`Database integer out of range: ${key}`);
      return [key, n];
    }
    return [key, value];
  })));
}

export function postgresDatabase(pool: SqlPool): Database {
  class Statement implements DatabaseStatement {
    constructor(readonly sql: string, readonly params: unknown[] = []) {}
    bind(...params: unknown[]) { return new Statement(this.sql, params); }
    async execute(client: SqlClient) {
      const result = await client.query(postgresSql(this.sql), this.params);
      return { results: normalizeRows(result.rows), meta: { changes: result.rowCount ?? 0 } };
    }
    async all<T = Record<string, unknown>>() {
      const client = await pool.connect();
      try { return await this.execute(client) as unknown as { results: T[] }; }
      finally { client.release(); }
    }
    async first<T = Record<string, unknown>>() { return (await this.all<T>()).results[0] ?? null; }
    async run() { return this.all(); }
  }
  return {
    prepare(sql) { return new Statement(sql); },
    async batch(statements) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Preserve D1's serialized batch semantics for submit, finalization and review.
        // The lock is transaction-scoped and released automatically on rollback.
        await client.query("SELECT pg_advisory_xact_lock(4042026)");
        const results = [];
        for (const statement of statements) {
          if (!(statement instanceof Statement)) throw new Error("Statement belongs to another database.");
          results.push(await statement.execute(client));
        }
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally { client.release(); }
    },
  };
}
