import { admin, db, handle, response } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => {
    await admin();
    const days = await db()
      .prepare(
        "SELECT day,closes_at,finalized_at,revision FROM competition_days ORDER BY day DESC LIMIT 60",
      )
      .all();
    return response({ days: days.results });
  });
}
