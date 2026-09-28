import { FINALIZE_SNAPSHOT, FINALIZE_DAY } from "./queries";
import initialSchema from "@/drizzle/0000_cute_madame_hydra.sql?raw";
import { initialSchemaStatements } from "./database-bootstrap";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { GAME } from "./game";
import { dayAt, dayEnd, SUBMIT_GRACE_MS } from "./protocol";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function db() {
  if (!env.DB)
    throw new HttpError(
      503,
      "The leaderboard is temporarily unavailable. Please try again.",
    );
  return env.DB;
}
export function response(
  data: unknown,
  status = 200,
  extra: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
export async function handle(fn: () => Promise<Response>) {
  try {
    await ensureDatabase();
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return response({ error: e.message }, e.status);
    console.error(
      "DINO404 request failed",
      e instanceof Error ? e.message : "Unknown error",
    );
    return response({ error: "Something went wrong. Please try again." }, 503);
  }
}
let schemaReady: Promise<void> | undefined;
function ensureDatabase() {
  if (!schemaReady) {
    const database = db();
    schemaReady = database
      .batch(initialSchemaStatements(initialSchema).map((sql) => database.prepare(sql)))
      .then(() => undefined)
      .catch((error) => {
        schemaReady = undefined;
        throw error;
      });
  }
  return schemaReady;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Cross-origin request denied.");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "Cross-site request denied.");
}
export async function body(request: Request, max = 50_000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Expected JSON.");
  if (Number(request.headers.get("content-length")) > max)
    throw new HttpError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request body.");
  let count = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    count += value.length;
    if (count > max) {
      await reader.cancel();
      throw new HttpError(413, "Request too large.");
    }
    chunks.push(value);
  }
  // Consume the bounded stream before rejecting its origin. Cancelling an unread
  // stream can terminate a reused local Worker proxy connection.
  sameOrigin(request);
  const bytes = new Uint8Array(count);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Expected an object.");
    return parsed;
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function session(request: Request) {
  return (
    request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)dino_session=([a-f0-9]{64})(?:;|$)/)?.[1] ?? null
  );
}
export function newSession() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
export function cookie(value: string, request: Request) {
  return `dino_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function rateLimit(key: string, limit: number, now = Date.now()) {
  const bucket = Math.floor(now / 60_000);
  const row = await db()
    .prepare(
      "INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .bind(key + ":" + bucket, now + 120_000)
    .first<{ count: number }>();
  if ((row?.count ?? 0) > limit)
    throw new HttpError(
      429,
      "Too many attempts. Give it a minute, then try again.",
    );
}
export async function ensureDay(now = Date.now()) {
  const day = dayAt(now);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  await db()
    .prepare(
      "INSERT OR IGNORE INTO competition_days (day,seed,version,closes_at,revision) VALUES (?,?,?,?,0)",
    )
    .bind(day, seed, GAME.version, dayEnd(day))
    .run();
  return await db()
    .prepare("SELECT * FROM competition_days WHERE day=?")
    .bind(day)
    .first<{
      day: string;
      seed: number;
      version: string;
      closes_at: number;
      finalized_at: number | null;
      revision: number;
    }>();
}
export async function finalizeDay(day: string, now = Date.now()) {
  // Each batch is a transaction. A competing finalizer sees the revision already incremented.
  const database = db();
  await database.batch([
    database
      .prepare(FINALIZE_SNAPSHOT)
      .bind(day, SUBMIT_GRACE_MS, now),
    database
      .prepare(FINALIZE_DAY)
      .bind(now, day, SUBMIT_GRACE_MS, now),
    database.prepare("DELETE FROM rate_limits WHERE expires_at<?").bind(now),
    database
      .prepare(
        "UPDATE runs SET input_log=NULL WHERE submitted_at<? AND input_log IS NOT NULL",
      )
      .bind(now - 30 * 86_400_000),
  ]);
}
export async function admin() {
  const user = await getChatGPTUser();
  if (!user) throw new HttpError(401, "Sign in to access the owner area.");
  const allowed = (env.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const local =
    process.env.NODE_ENV === "development" && user.userId === "local_seedy";
  if (!local && (!allowed || user.email.toLowerCase() !== allowed))
    throw new HttpError(403, "This account is not configured as the owner.");
  return user;
}
export function rewards() {
  const amounts = [env.REWARD_FIRST, env.REWARD_SECOND, env.REWARD_THIRD];
  const enabled =
    env.REWARDS_ENABLED === "true" &&
    /^0x[0-9a-fA-F]{40}$/.test(env.REWARD_CONTRACT ?? "") &&
    !/^0x0{40}$/i.test(env.REWARD_CONTRACT ?? "") &&
    amounts.every((x) => !!x && /^\d+(\.\d+)?$/.test(x) && Number(x) > 0) &&
    !!env.REWARD_SCHEDULE;
  return {
    enabled,
    asset: "GOOGLc",
    network: "Robinhood Chain",
    chainId: 4663,
    amounts: enabled ? amounts : [],
    schedule: enabled ? env.REWARD_SCHEDULE : null,
    contract: enabled ? env.REWARD_CONTRACT : null,
  };
}
