import { env } from "cloudflare:workers";
import type { Database } from "./postgres";
export { env };
export const runtimeKind = "sites" as string;
export function runtimeDatabase(): Database {
  if (!env.DB) throw new Error("The leaderboard database is unavailable.");
  return env.DB as unknown as Database;
}
