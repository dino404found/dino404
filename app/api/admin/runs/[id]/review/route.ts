import {
  admin,
  body,
  db,
  finalizeDay,
  handle,
  HttpError,
  response,
} from "@/lib/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const user = await admin();
    const { id } = await context.params;
    const value = await body(request, 2048);
    if (
      typeof value.reason !== "string" ||
      value.reason.trim().length < 10 ||
      value.reason.length > 500
    )
      throw new HttpError(
        400,
        "Give a clear review reason (10–500 characters).",
      );
    const run = await db()
      .prepare("SELECT day,wallet,status FROM runs WHERE id=?")
      .bind(id)
      .first<{ day: string; wallet: string; status: string }>();
    if (!run || run.status !== "accepted")
      throw new HttpError(409, "This run is not eligible for review.");
    const database = db();
    await database.batch([
      database
        .prepare(
          "UPDATE runs SET status='excluded' WHERE id=? AND status='accepted'",
        )
        .bind(id),
      database
        .prepare("DELETE FROM daily_best WHERE day=? AND wallet=?")
        .bind(run.day, run.wallet),
      database
        .prepare(
          "INSERT INTO daily_best(day,wallet,name,score,achieved_at,run_id) SELECT day,wallet,name,score,achieved_at,id FROM runs WHERE day=? AND wallet=? AND status='accepted' ORDER BY score DESC,achieved_at ASC,id ASC LIMIT 1",
        )
        .bind(run.day, run.wallet),
      database
        .prepare("UPDATE competition_days SET finalized_at=NULL WHERE day=?")
        .bind(run.day),
      database
        .prepare(
          "INSERT INTO audit_events(id,at,actor,action,target,reason) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          Date.now(),
          user.userId,
          "exclude_run",
          id,
          value.reason.trim(),
        ),
    ]);
    await finalizeDay(run.day);
    return response({ status: "excluded", day: run.day });
  });
}
