import {
  admin,
  db,
  finalizeDay,
  handle,
  HttpError,
  response,
} from "@/lib/server";
import { validDay } from "@/lib/protocol";
export const dynamic = "force-dynamic";
export async function GET(
  _: Request,
  context: { params: Promise<{ day: string }> },
) {
  return handle(async () => {
    await admin();
    const { day } = await context.params;
    if (!validDay(day)) throw new HttpError(400, "Invalid date.");
    await finalizeDay(day);
    const info = await db()
      .prepare("SELECT * FROM competition_days WHERE day=?")
      .bind(day)
      .first();
    if (!info)
      throw new HttpError(404, "No competition took place on this date.");
    const rows = await db()
      .prepare(
        "SELECT b.*,r.input_log,r.ticks,r.reason FROM daily_best b JOIN runs r ON b.run_id=r.id WHERE b.day=? ORDER BY b.score DESC,b.achieved_at ASC,b.run_id ASC LIMIT 10",
      )
      .bind(day)
      .all();
    const audit = await db()
      .prepare(
        "SELECT at,action,target,reason FROM audit_events WHERE target IN (SELECT id FROM runs WHERE day=?) ORDER BY at DESC LIMIT 30",
      )
      .bind(day)
      .all();
    return response({ info, entries: rows.results, audit: audit.results });
  });
}
