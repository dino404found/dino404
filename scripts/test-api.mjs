import assert from "node:assert/strict";
const base = process.env.TEST_ORIGIN ?? "http://localhost:5173";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("API tests must use a local preview, never production.");
const checks = [];
const check = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
};
let cookie = "";
async function request(path, body, headers = {}) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json", Origin: base } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const c = r.headers.get("set-cookie");
  if (c) cookie = c.split(";")[0];
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }
  return { r, data };
}
let q = await request("/api/competition");
check(
  "competition uses a UTC day and server clock",
  q.r.ok && q.data.closesAt > q.data.serverNow && q.data.day.length === 10,
);
q = await request("/api/admin/results");
check("anonymous owner results denied", q.r.status === 401);
q = await request("/api/runs", { name: "X", wallet: "0x123", confirmed: true });
check("invalid identity rejected", q.r.status === 400);
q = await request(
  "/api/runs",
  { name: "API Test", wallet: "0x" + "e".repeat(40), confirmed: true },
  { Origin: "https://attacker.example" },
);
check("cross-origin writes denied", q.r.status === 403);
const player = {
  name: "API Test",
  wallet: "0x" + "e".repeat(40),
  confirmed: true,
};
q = await request("/api/runs", player);
assert.equal(q.r.status, 201, JSON.stringify(q.data));
check("valid run ticket issued", q.r.status === 201 && !!q.data.id);
const ticket = q.data;
q = await request(`/api/runs/${ticket.id}/submit`, {
  ticks: 10000,
  inputs: [],
  reason: "interrupted",
  score: 99999999,
});
check("accelerated fabricated score denied", q.r.status === 422);
await new Promise((r) =>
  setTimeout(r, Math.max(0, ticket.startAt + 1550 - Date.now())),
);
const payload = {
  ticks: 90,
  inputs: [],
  reason: "interrupted",
  score: 99999999,
};
const responses = await Promise.all([
  request(`/api/runs/${ticket.id}/submit`, payload),
  request(`/api/runs/${ticket.id}/submit`, payload),
]);
check(
  "concurrent submits idempotent and score computed by server",
  responses.every((x) => x.r.ok && x.data.score > 0 && x.data.score < 100),
);
q = await request("/api/player", {
  wallet: player.wallet.toUpperCase().replace("0X", "0x"),
});
check(
  "case variants use the same best score",
  q.r.ok && q.data.score === responses[0].data.score,
);
q = await request("/api/leaderboard");
check(
  "leaderboard has one record per wallet and no complete wallets",
  q.r.ok &&
    q.data.entries.filter((x) => x.wallet === "0xeeee…eeee").length === 1 &&
    !JSON.stringify(q.data).includes(player.wallet),
);
q = await request("/api/leaderboard?date=2026-02-30");
check("invalid historical dates rejected", q.r.status === 400);
q = await request(`/api/admin/results/${ticket.day}/export`);
check("CSV cannot be downloaded anonymously", q.r.status === 401);
console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
