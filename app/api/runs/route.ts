import {
  body,
  cookie,
  db,
  ensureDay,
  handle,
  hash,
  HttpError,
  newSession,
  rateLimit,
  response,
  session,
} from "@/lib/server";
import { identity } from "@/lib/protocol";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handle(async () => {
    const value = await body(request, 2048);
    let player;
    try {
      player = identity(value);
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }
    if (value.confirmed !== true)
      throw new HttpError(400, "Please confirm your receiving address.");
    const raw = session(request) ?? newSession();
    const sid = await hash(raw);
    const now = Date.now();
    await rateLimit("start-session:" + sid, 20, now);
    await rateLimit("start-wallet:" + player.wallet, 30, now);
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) await rateLimit("start-ip:" + (await hash(ip)), 60, now);
    const day = await ensureDay(now);
    if (day!.closes_at - now < 4500)
      throw new HttpError(
        409,
        "A new daily run is about to begin. Try again in a few seconds.",
      );
    const id = crypto.randomUUID(),
      startAt = now + 3500;
    await db().batch([
      db()
        .prepare(
          "UPDATE runs SET status='abandoned' WHERE session=? AND status='active'",
        )
        .bind(sid),
      db()
        .prepare(
          "INSERT INTO runs (id,day,session,wallet,name,seed,version,start_at,status) VALUES (?,?,?,?,?,?,?,?,'active')",
        )
        .bind(
          id,
          day!.day,
          sid,
          player.wallet,
          player.name,
          day!.seed,
          day!.version,
          startAt,
        ),
    ]);
    return response(
      {
        id,
        day: day!.day,
        seed: day!.seed,
        version: day!.version,
        startAt,
        closesAt: day!.closes_at,
        serverNow: Date.now(),
      },
      201,
      { "Set-Cookie": cookie(raw, request) },
    );
  });
}
