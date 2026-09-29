import {
  admin,
  body,
  db,
  handle,
  HttpError,
  response,
} from "@/lib/server";
import { reviewStatements } from "@/lib/review";
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
    if (!run || !["accepted", "excluded"].includes(run.status))
      throw new HttpError(409, "This run is not eligible for review.");
    if (run.status === "excluded") return response({ status: "excluded", day: run.day });
    const database = db();
    await database.batch(reviewStatements({
      id, day: run.day, wallet: run.wallet, operationId: crypto.randomUUID(),
      at: Date.now(), actor: user.userId, reason: value.reason.trim(),
    }).map(({ sql, params }) => database.prepare(sql).bind(...params)));
    return response({ status: "excluded", day: run.day });
  });
}
