import { UPSERT_BEST, FINALIZE_SNAPSHOT, FINALIZE_DAY } from "../lib/queries";
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GAME, createGame, replay, step } from "../lib/game";
import {
  csv,
  dayAt,
  dayEnd,
  identity,
  validateRun,
  validDay,
  type RunTicket,
} from "../lib/protocol";

test("EVM identity is normalized and unsafe names/addresses are rejected", () => {
  assert.deepEqual(
    identity({
      name: "  Green_Rex  ",
      wallet: "0xAbCdEf0123456789012345678901234567890123",
    }),
    { name: "Green_Rex", wallet: "0xabcdef0123456789012345678901234567890123" },
  );
  for (const name of ["a", "<script>", "=SUM(A1)", "a".repeat(21)])
    assert.throws(() => identity({ name, wallet: "0x" + "1".repeat(40) }));
  for (const wallet of ["0x123", "0x" + "0".repeat(40), "solana-address"])
    assert.throws(() => identity({ name: "Dino", wallet }));
});
test("UTC boundaries and invalid calendar dates", () => {
  assert.equal(dayAt(Date.parse("2026-09-28T23:59:59Z")), "2026-09-28");
  assert.equal(dayAt(dayEnd("2026-09-28")), "2026-09-29");
  assert.equal(validDay("2026-02-30"), false);
  assert.equal(validDay("2026-09-28"), true);
});
test("simulation replay gives identical score, state and collision", () => {
  const s = createGame(48),
    inputs: number[] = [];
  while (!s.dead && s.tick < 5000) {
    const next = s.obstacles.find((o) => o.x + o.w > GAME.dinoX);
    const j =
      !!next && next.kind !== "high" && next.x - GAME.dinoX < 100 && s.y === 0;
    if (j) inputs.push(s.tick);
    step(s, j);
  }
  const replayed = replay(48, s.tick, inputs);
  assert.deepEqual(replayed, s);
  assert.ok(s.score > 0);
});
test("jump is single-height and cannot double jump", () => {
  const a = createGame(1),
    b = createGame(1);
  step(a, true);
  step(b, true);
  for (let i = 0; i < 20; i++) {
    step(a, true);
    step(b, false);
  }
  assert.equal(a.y, b.y);
  assert.equal(a.vy, b.vy);
});
test("unaltered no-input run collides, and inputs after collision are rejected", () => {
  const s = createGame(7);
  while (!s.dead) step(s);
  assert.ok(s.tick < 1000);
  assert.throws(() => replay(7, s.tick + 1, []), /after a collision/);
});
test("reject malformed replay inputs, excessive duration and unordered input logs", () => {
  for (const [ticks, inputs] of [
    [1.5, []],
    [GAME.maxTicks + 1, []],
    [100, [4, 4]],
    [100, [-1]],
    [100, [100]],
    [100, [2, 1]],
  ] as [number, number[]][])
    assert.throws(() => replay(1, ticks, inputs));
});
const start = Date.parse("2026-09-28T12:00:00Z");
const ticket: RunTicket = {
  id: "test",
  day: "2026-09-28",
  seed: 1,
  version: GAME.version,
  startAt: start,
  closesAt: dayEnd("2026-09-28"),
  serverNow: start,
};
test("server verifies score rather than trusting a claimed score", () => {
  const result = validateRun(
    ticket,
    { ticks: 90, inputs: [], reason: "interrupted" },
    start + 1600,
  );
  assert.equal(result.score, replay(1, 90, []).score);
  assert.ok(result.achievedAt >= start);
});
test("reject time acceleration and expired retry window", () => {
  assert.throws(
    () =>
      validateRun(
        ticket,
        { ticks: 120, inputs: [], reason: "interrupted" },
        start + 500,
      ),
    /clock/,
  );
  assert.throws(
    () =>
      validateRun(
        ticket,
        { ticks: 90, inputs: [], reason: "interrupted" },
        start + 62000,
      ),
    /window/,
  );
});
test("verify actual collision and terminal reasons", () => {
  assert.throws(
    () =>
      validateRun(
        ticket,
        { ticks: 90, inputs: [], reason: "collision" },
        start + 1600,
      ),
    /Collision/,
  );
  assert.throws(
    () =>
      validateRun(
        ticket,
        { ticks: 90, inputs: [], reason: "time-limit" },
        start + 1600,
      ),
    /limit/,
  );
  assert.throws(
    () =>
      validateRun(
        ticket,
        { ticks: 90, inputs: [], reason: "day-end" },
        start + 1600,
      ),
    /day/,
  );
});
test("midnight cutoff permits only activity before midnight", () => {
  const t = { ...ticket, startAt: ticket.closesAt - 1000 };
  assert.doesNotThrow(() =>
    validateRun(
      t,
      { ticks: 60, inputs: [], reason: "day-end" },
      t.closesAt + 500,
    ),
  );
  assert.throws(
    () =>
      validateRun(
        t,
        { ticks: 61, inputs: [], reason: "interrupted" },
        t.closesAt + 500,
      ),
    /window/,
  );
  assert.throws(
    () =>
      validateRun(
        t,
        { ticks: 60, inputs: [], reason: "day-end" },
        t.closesAt + 60001,
      ),
    /window/,
  );
});
test("CSV quoting, formula neutralization, UTF-8, and empty header", () => {
  const c = csv(
    [
      { name: '=HYPERLINK("bad")', wallet: "0x123", score: 99 },
      { name: 'Dino, "Sage"\n二', wallet: "0xabc", score: 1 },
    ],
    ["name", "wallet", "score"],
  );
  assert.ok(c.startsWith('\uFEFF"name"'));
  assert.ok(c.includes("'=HYPERLINK"));
  assert.ok(c.includes('Dino, ""Sage""\n二'));
  assert.equal(csv([], ["a", "b"]), '\uFEFF"a","b"\r\n');
});

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("drizzle/0000_cute_madame_hydra.sql", "utf8"));
  return db;
}
// Exercise the production statements against SQLite.
const bestSql=UPSERT_BEST, finalSql=FINALIZE_SNAPSHOT, finalizeSql=FINALIZE_DAY;
function insert(
  db: DatabaseSync,
  id: string,
  wallet: string,
  score: number,
  at: number,
  day = "2026-09-28",
) {
  db.prepare(
    "INSERT INTO runs (id,day,session,wallet,name,seed,version,start_at,status,score,achieved_at) VALUES (?,?,?,?,?,1,?,?,'accepted',?,?)",
  ).run(id, day, "session", wallet, id, GAME.version, start, score, at);
  db.prepare(bestSql).run(id);
}
test("actual SQL only raises best score; equal scores preserve record/name/time", () => {
  const db = database();
  db.prepare(
    "INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,?,?)",
  ).run(ticket.day, GAME.version, ticket.closesAt);
  insert(db, "a", "wallet-a", 500, 100);
  insert(db, "b", "wallet-a", 350, 200);
  insert(db, "c", "wallet-a", 500, 50);
  let row = db.prepare("SELECT * FROM daily_best").get()!;
  assert.equal(row.score, 500);
  assert.equal(row.run_id, "a");
  assert.equal(row.achieved_at, 100);
  insert(db, "d", "wallet-a", 700, 300);
  row = db.prepare("SELECT * FROM daily_best").get()!;
  assert.equal(row.score, 700);
  assert.equal(row.name, "d");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM daily_best").get()!.n, 1);
  db.close();
});
test("actual ranking and snapshot SQL preserve top 3, earliest score tie, and revisions", () => {
  const db = database();
  db.prepare(
    "INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,?,?)",
  ).run(ticket.day, GAME.version, ticket.closesAt);
  insert(db, "a", "a", 500, 20);
  insert(db, "b", "b", 700, 40);
  insert(db, "c", "c", 700, 30);
  insert(db, "d", "d", 100, 1);
  const now = ticket.closesAt + 60001;
  db.prepare(finalSql).run(ticket.day, 60000, now);
  db.prepare(finalizeSql).run(now, ticket.day, 60000, now);
  db.prepare(finalSql).run(ticket.day, 60000, now);
  assert.deepEqual(
    db
      .prepare("SELECT wallet FROM daily_results ORDER BY rank")
      .all()
      .map((r) => r.wallet),
    ["c", "b", "a"],
  );
  assert.equal(
    db.prepare("SELECT revision FROM competition_days").get()!.revision,
    1,
  );
  insert(db, "e", "e", 9999, 1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM daily_best").get()!.n, 4);
  db.close();
});
test("empty competition finalizes without fabricated winners", () => {
  const db = database();
  db.prepare(
    "INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,?,?)",
  ).run(ticket.day, GAME.version, ticket.closesAt);
  db.prepare(finalSql).run(ticket.day, 60000, ticket.closesAt + 60001);
  db.prepare(finalizeSql).run(
    ticket.closesAt + 60001,
    ticket.day,
    60000,
    ticket.closesAt + 60001,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM daily_results").get()!.n, 0);
  assert.equal(
    db.prepare("SELECT revision FROM competition_days").get()!.revision,
    1,
  );
  db.close();
});
test("pattern generator maintains safe intervals across many seeds and maximum speed", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const s = createGame(seed);
    let previousSpawn = -9999,
      seen = 0;
    for (let t = 0; t < 15000; t++) {
      s.dead = false;
      const before = s.count;
      step(s);
      if (s.count !== before) {
        assert.ok(s.tick - previousSpawn >= 100);
        previousSpawn = s.tick;
        seen++;
        const o = s.obstacles.at(-1)!;
        assert.ok(o.h <= 44);
        assert.ok(o.w <= 44);
      }
      assert.ok(s.speed <= GAME.maxSpeed);
    }
    assert.ok(seen > 60);
  }
});
test("ranking query uses indexed day lookup", () => {
  const db = database();
  const plan = db
    .prepare(
      "EXPLAIN QUERY PLAN SELECT * FROM daily_best WHERE day=? ORDER BY score DESC,achieved_at ASC,run_id ASC LIMIT 10",
    )
    .all(ticket.day);
  assert.ok(
    plan.some((r) => /USING INDEX|USING COVERING INDEX/.test(String(r.detail))),
  );
  db.close();
});
test("one-button strategy can survive generated sequences through maximum speed", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = createGame(seed);
    while (s.tick < 40000 && !s.dead) {
      const next = s.obstacles.find((o) => o.x + o.w > GAME.dinoX);
      const jump =
        !!next &&
        next.kind !== "high" &&
        s.y === 0 &&
        next.x - GAME.dinoX < s.speed * 14;
      step(s, jump);
    }
    assert.equal(s.dead, false, `seed ${seed}, tick ${s.tick}`);
    assert.equal(s.speed, GAME.maxSpeed);
  }
});
