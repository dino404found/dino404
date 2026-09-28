import { GAME, replay, supportedVersion } from "./game";
export const SUBMIT_GRACE_MS = 60_000;
export const DAY_MS = 86_400_000;
export type Identity = { name: string; wallet: string };
export type RunTicket = {
  id: string;
  seed: number;
  version: string;
  day: string;
  startAt: number;
  closesAt: number;
  serverNow: number;
};
export type RunPayload = {
  ticks: number;
  inputs: number[];
  ducks?: number[];
  reason: "collision" | "interrupted" | "day-end" | "time-limit";
};
export function dayAt(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}
export function dayEnd(day: string) {
  return Date.parse(day + "T00:00:00.000Z") + DAY_MS;
}
export function validDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day)) &&
    dayAt(Date.parse(day)) === day
  );
}
export function identity(value: unknown): Identity {
  if (!value || typeof value !== "object")
    throw new Error("Enter your name and wallet address.");
  const v = value as Record<string, unknown>;
  const name =
    typeof v.name === "string" ? v.name.normalize("NFKC").trim() : "";
  const wallet = typeof v.wallet === "string" ? v.wallet.trim() : "";
  if (!/^[\p{L}\p{N} _-]{2,20}$/u.test(name))
    throw new Error(
      "Use 2–20 letters, numbers, spaces, hyphens or underscores for your name.",
    );
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet) || /^0x0{40}$/i.test(wallet))
    throw new Error(
      "Enter a valid receiving address: 0x followed by 40 hexadecimal characters.",
    );
  return { name, wallet: wallet.toLowerCase() };
}
export function shortWallet(wallet: string) {
  return wallet.slice(0, 6) + "…" + wallet.slice(-4);
}
export function validateRun(
  ticket: RunTicket,
  payload: RunPayload,
  now: number,
) {
  if (!supportedVersion(ticket.version))
    throw new Error("This run uses an expired game version.");
  if (
    !payload ||
    !["collision", "interrupted", "day-end", "time-limit"].includes(
      payload.reason,
    )
  )
    throw new Error("Invalid finish reason.");
  const end = ticket.startAt + (payload.ticks * 1000) / GAME.hz;
  if (now < ticket.startAt || end > now + 150)
    throw new Error("The run clock does not match the server.");
  if (
    end > ticket.closesAt + 0.001 ||
    now > ticket.closesAt + SUBMIT_GRACE_MS ||
    now > end + SUBMIT_GRACE_MS
  )
    throw new Error("The submission window has ended.");
  const s = replay(ticket.seed, payload.ticks, payload.inputs, payload.ducks, ticket.version);
  if (payload.reason === "collision" && !s.dead)
    throw new Error("Collision could not be verified.");
  if (s.dead && payload.reason !== "collision")
    throw new Error("A collision must finish the run.");
  if (
    payload.reason === "day-end" &&
    ticket.closesAt - end > 1000 / GAME.hz + 1
  )
    throw new Error("The day has not ended.");
  if (payload.reason === "time-limit" && payload.ticks !== GAME.maxTicks)
    throw new Error("The run limit has not been reached.");
  return {
    score: s.score,
    achievedAt: Math.floor(ticket.startAt + (s.scoreTick * 1000) / GAME.hz),
  };
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function inputSummary(log: string | null) {
  if (!log) return "Input log expired";
  try {
    const value = JSON.parse(log);
    if (Array.isArray(value)) return `${value.length} jumps · classic`;
    if (Array.isArray(value?.jumps) && Array.isArray(value?.ducks))
      return `${value.jumps.length} jumps · ${Math.ceil(value.ducks.length / 2)} duck holds`;
  } catch { /* Keep historical run review usable if a log is malformed. */ }
  return "Input log unavailable";
}
export function csv(rows: Record<string, unknown>[], columns: string[]) {
  return (
    "\uFEFF" +
    [
      columns.map(csvCell).join(","),
      ...rows.map((r) => columns.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n") +
    "\r\n"
  );
}
