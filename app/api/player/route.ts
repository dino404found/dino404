import {
  body,
  db,
  handle,
  HttpError,
  response,
  rateLimit,
  session,
  hash,
  clientIp,
} from "@/lib/server";
import { dayAt, identity } from "@/lib/protocol";
export async function POST(request: Request) {
  return handle(async () => {
    const p = await body(request, 1024);
    let wallet: string;
    try {
      wallet = identity({ name: "Player", wallet: p.wallet }).wallet;
    } catch {
      throw new HttpError(400, "Invalid wallet address.");
    }
    await rateLimit(
      "lookup:" +
        (await hash(
          session(request) ??
            clientIp(request) ??
            "anonymous",
        )),
      120,
    );
    const day = dayAt(Date.now());
    const row = await db()
      .prepare(
        "SELECT score,rank FROM (SELECT wallet,score,ROW_NUMBER() OVER(ORDER BY score DESC,achieved_at ASC,run_id ASC) rank FROM daily_best WHERE day=?) WHERE wallet=?",
      )
      .bind(day, wallet)
      .first<{ score: number; rank: number }>();
    return response({ day, score: row?.score ?? 0, rank: row?.rank ?? null });
  });
}
