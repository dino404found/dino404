import { getDatabase } from "@netlify/database";
import { postgresDatabase, type Database, type SqlPool } from "./postgres";

export const runtimeKind = "netlify" as string;
export const env = process.env;
let instance: Database | undefined;
export function runtimeDatabase(): Database {
  if (!instance) {
    const pool = getDatabase().pool;
    // One connection per warm function limits serverless connection pressure.
    // Separate function instances still coordinate writes with the Postgres lock.
    pool.options.max = 1;
    instance = postgresDatabase(pool as unknown as SqlPool);
  }
  return instance;
}
