import {
  ensureDay,
  finalizeDay,
  handle,
  response,
  rewards,
} from "@/lib/server";
import { dayAt } from "@/lib/protocol";
export const dynamic = "force-dynamic";
export async function GET() {
  return handle(async () => {
    const now = Date.now();
    const day = await ensureDay(now);
    await finalizeDay(dayAt(now - 86_400_000), now);
    return response({
      day: day!.day,
      closesAt: day!.closes_at,
      serverNow: Date.now(),
      version: day!.version,
      rewards: rewards(),
    });
  });
}
