import { UPSERT_BEST } from "@/lib/queries";
import {
  body,
  db,
  handle,
  hash,
  HttpError,
  rateLimit,
  response,
  session,
} from "@/lib/server";
import { validateRun, type RunPayload } from "@/lib/protocol";
type Run = {
  id: string;
  day: string;
  session: string;
  wallet: string;
  name: string;
  seed: number;
  version: string;
  start_at: number;
  status: string;
  score: number;
  achieved_at: number;
};
export const dynamic = "force-dynamic";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const raw = session(request);
    if (!raw)
      throw new HttpError(401, "Your run session expired. Start a new run.");
    const sid = await hash(raw);
    await rateLimit("submit:" + sid, 45);
    const payload = (await body(request)) as RunPayload;
    const { id } = await context.params;
    const run = await db()
      .prepare("SELECT * FROM runs WHERE id=? AND session=?")
      .bind(id, sid)
      .first<Run>();
    if (!run) throw new HttpError(404, "Run not found.");
    if (!["active", "accepted"].includes(run.status))
      throw new HttpError(
        409,
        "This run is no longer eligible. Start a new run.",
      );
    const now = Date.now();
    if (run.status === "active") {
      let verified;
      try {
        verified = validateRun(
          {
            id,
            seed: run.seed,
            day: run.day,
            version: run.version,
            startAt: run.start_at,
            closesAt: Date.parse(run.day + "T00:00:00Z") + 86400000,
            serverNow: now,
          },
          payload,
          now,
        );
      } catch (e) {
        throw new HttpError(422, (e as Error).message);
      }
      await db().batch([
        db()
          .prepare(
            "UPDATE runs SET status='accepted',score=?,achieved_at=?,submitted_at=?,ticks=?,input_log=?,reason=? WHERE id=? AND status='active' AND EXISTS(SELECT 1 FROM competition_days WHERE day=runs.day AND finalized_at IS NULL)",
          )
          .bind(
            verified.score,
            verified.achievedAt,
            now,
            payload.ticks,
            JSON.stringify(run.version === "1.0.0" ? payload.inputs : { jumps: payload.inputs, ducks: payload.ducks ?? [] }),
            payload.reason,
            id,
          ),
        db()
          .prepare(UPSERT_BEST)
          .bind(id),
      ]);
    }
    const accepted = await db()
      .prepare("SELECT score,status FROM runs WHERE id=?")
      .bind(id)
      .first<{ score: number; status: string }>();
    if (accepted?.status !== "accepted")
      throw new HttpError(409, "The daily result has closed.");
    const best = await db()
      .prepare("SELECT score,run_id FROM daily_best WHERE day=? AND wallet=?")
      .bind(run.day, run.wallet)
      .first<{ score: number; run_id: string }>();
    const rank = await db()
      .prepare(
        "SELECT rank FROM (SELECT wallet,ROW_NUMBER() OVER(ORDER BY score DESC,achieved_at ASC,run_id ASC) rank FROM daily_best WHERE day=?) WHERE wallet=?",
      )
      .bind(run.day, run.wallet)
      .first<{ rank: number }>();
    return response({
      status: "accepted",
      score: accepted.score,
      best: best?.score ?? 0,
      rank: rank?.rank ?? null,
      improved: best?.run_id === id,
      day: run.day,
    });
  });
}
