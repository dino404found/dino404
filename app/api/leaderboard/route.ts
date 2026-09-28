import {
  db,
  ensureDay,
  finalizeDay,
  handle,
  HttpError,
  response,
} from "@/lib/server";
import { dayAt, shortWallet, validDay } from "@/lib/protocol";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handle(async () => {
    const url = new URL(request.url),
      day = url.searchParams.get("date") ?? dayAt(Date.now());
    if (!validDay(day) || day > dayAt(Date.now()))
      throw new HttpError(400, "Choose a valid competition date.");
    await ensureDay();
    await finalizeDay(day);
    const info = await db()
      .prepare(
        "SELECT day,finalized_at,revision FROM competition_days WHERE day=?",
      )
      .bind(day)
      .first<{ day: string; finalized_at: number | null; revision: number }>();
    const rows = await db()
      .prepare(
        "SELECT name,wallet,score,achieved_at,ROW_NUMBER() OVER(ORDER BY score DESC,achieved_at ASC,run_id ASC) rank FROM daily_best WHERE day=? ORDER BY score DESC,achieved_at ASC,run_id ASC LIMIT 10",
      )
      .bind(day)
      .all<{
        name: string;
        wallet: string;
        score: number;
        rank: number;
        achieved_at: number;
      }>();
    return response({
      day,
      final: !!info?.finalized_at,
      revision: info?.revision ?? 0,
      entries: rows.results.map((r) => ({
        name: r.name,
        wallet: shortWallet(r.wallet),
        score: r.score,
        rank: r.rank,
        achievedAt: r.achieved_at,
      })),
    });
  });
}
