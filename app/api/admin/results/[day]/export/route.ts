import { admin, db, finalizeDay, handle, HttpError } from "@/lib/server";
import { csv, validDay } from "@/lib/protocol";
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
      .prepare("SELECT finalized_at,revision FROM competition_days WHERE day=?")
      .bind(day)
      .first<{ finalized_at: number | null; revision: number }>();
    if (!info)
      throw new HttpError(404, "No competition took place on this date.");
    if (!info.finalized_at)
      throw new HttpError(
        409,
        "Wait until the UTC day and its 60-second submission window have ended.",
      );
    const rows = await db()
      .prepare(
        "SELECT * FROM daily_results WHERE day=? AND revision=? ORDER BY rank",
      )
      .bind(day, info.revision)
      .all<{
        rank: number;
        name: string;
        wallet: string;
        score: number;
        achieved_at: number;
        run_id: string;
      }>();
    const exported = new Date().toISOString();
    const data = rows.results.map((r) => ({
      competition_date_utc: day,
      rank: r.rank,
      dino_name: r.name,
      wallet_address: r.wallet,
      score: r.score,
      achieved_at_utc: new Date(r.achieved_at).toISOString(),
      run_id: r.run_id,
      verification_status: "server_verified",
      result_revision: info.revision,
      exported_at_utc: exported,
    }));
    const columns = [
      "competition_date_utc",
      "rank",
      "dino_name",
      "wallet_address",
      "score",
      "achieved_at_utc",
      "run_id",
      "verification_status",
      "result_revision",
      "exported_at_utc",
    ];
    return new Response(csv(data, columns), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dino404-winners-${day}-utc-r${info.revision}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
