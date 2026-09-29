import { UPSERT_BEST, FINALIZE_SNAPSHOT, FINALIZE_DAY, ADVANCE_PRESEASON_VERSION } from "../lib/queries";
import { initialSchemaStatements } from "../lib/database-bootstrap";
import { reviewStatements } from "../lib/review";
import { personalStanding, isCurrentResponse } from "../lib/standings";
import { nightAt, sceneColors } from "../lib/scenery";
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GAME, createGame, replay, step, type Obstacle } from "../lib/game";
import { replay as replayV1 } from "../lib/game-v1";
import {
  csv,
  dayAt,
  dayEnd,
  identity,
  validateRun,
  validDay,
  inputSummary,
  type RunTicket,
} from "../lib/protocol";

test("scenery starts fading at each 1000-point milestone without a reset flash", () => {
  for (const [score, expected] of [[0,0],[999,0],[1000,0],[1050,0.5],[1100,1],[1999,1],[2000,1],[2050,0.5],[2100,0],[3000,0],[3100,1]]) {
    assert.equal(nightAt(score * 12), expected);
  }
  for (const score of [1000,1100,2000,2100,3000]) assert.ok(Math.abs(nightAt(score * 12 - 0.01) - nightAt(score * 12 + 0.01)) < 0.00001);
});

test("scenery keeps labels and drone ink readable through every fade and zone", () => {
  const luminance = (hex: string) => {
    const rgb = [1,3,5].map(k => { const n = parseInt(hex.slice(k,k+2),16)/255; return n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4; });
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  for (let score = 0; score <= 6000; score += 5) {
    const palette = sceneColors(score * 12);
    for (const [surface, foreground] of [[palette.sky, palette.ink], [palette.ground, palette.uiInk]]) {
      const ink = luminance(foreground), background = luminance(surface), contrast = (Math.max(ink, background)+.05)/(Math.min(ink, background)+.05);
      assert.ok(contrast >= 3, `Insufficient scene contrast at ${score}: ${contrast}`);
    }
  }
});

test("fresh hosted database initializes all tables and preserves data on repeated bootstrap", () => {
  const database = new DatabaseSync(":memory:");
  const statements = initialSchemaStatements(readFileSync("drizzle/0000_cute_madame_hydra.sql", "utf8"));
  for (const sql of statements) database.exec(sql);
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get()?.n, 6);
  database.exec("INSERT INTO competition_days(day,seed,version,closes_at) VALUES ('2026-09-28',42,'1.0.0',1790640000000)");
  for (const sql of statements) database.exec(sql);
  assert.equal(database.prepare("SELECT seed FROM competition_days WHERE day='2026-09-28'").get()?.seed, 42);
  database.close();
});
test("bootstrap refuses destructive or data-changing SQL", () => {
  assert.throws(() => initialSchemaStatements("DROP TABLE runs;"));
  assert.throws(() => initialSchemaStatements("DELETE FROM runs;"));
});

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
        assert.ok(s.tick - previousSpawn >= 76);
        previousSpawn = s.tick;
        seen++;
        const o = s.obstacles.at(-1)!;
        assert.ok(o.h <= 44);
        assert.ok(o.w <= 68);
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

function crossing(kind: Obstacle["kind"], duck: boolean, airborne = false) {
  const s = createGame(1);
  s.next = Infinity;
  if (airborne) s.y = -76;
  s.obstacles = [{ id: 1, kind, x: GAME.dinoX + 28, w: 46, h: 24, group: 1,
    y: GAME.ground - (kind === "mid" ? 60 : kind === "low" ? 31 : 111) }];
  step(s, false, duck);
  return s;
}
test("mid-height drone hits a standing dinosaur and clears a held duck", () => {
  assert.equal(crossing("mid", false).dead, true);
  assert.equal(crossing("mid", true).dead, false);
  assert.equal(crossing("mid", true).ducking, true);
});
test("low drones cannot be ducked and high drones reward staying on the ground", () => {
  assert.equal(crossing("low", true).dead, true);
  assert.equal(crossing("low", false).dead, true);
  assert.equal(crossing("high", false).dead, false);
  assert.equal(crossing("high", false, true).dead, true);
});
test("duck release restores standing and holding down prevents a jump", () => {
  const s = createGame(1);
  step(s, true, true);
  assert.equal(s.y, 0);
  assert.equal(s.ducking, true);
  step(s, false, false);
  assert.equal(s.ducking, false);
  step(s, true, false);
  assert.ok(s.y < 0);
});
test("down in the air lands sooner and becomes a duck on landing", () => {
  const a = createGame(1), b = createGame(1);
  step(a, true); step(b, true);
  for (let i = 0; i < 6; i++) { step(a); step(b); }
  let ticks = 0;
  while (a.y < 0 && ticks++ < 60) { step(a, false, true); step(b); }
  assert.ok(ticks < 15);
  assert.equal(a.y, 0);
  assert.equal(a.ducking, true);
  assert.ok(b.y < 0);
});
test("all flight heights are introduced in the first eight obstacles for every seed", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const s = createGame(seed), kinds: string[] = [];
    while (s.count < 8) {
      s.dead = false; const count = s.count; step(s);
      if (count !== s.count) kinds.push(s.obstacles.at(-1)!.kind);
      if (s.count === 3) assert.ok(s.tick < 650);
    }
    assert.equal(kinds[2], "mid"); assert.equal(kinds[4], "low"); assert.equal(kinds[7], "high");
  }
});
test("jump and duck strategy survives through maximum speed with identical server replay", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = createGame(seed), jumps: number[] = [], ducks: number[] = [];
    while (s.tick < 40000 && !s.dead) {
      const o = s.obstacles.find((o) => o.x + o.w > GAME.dinoX);
      const duck = !!o && o.kind === "mid" && o.x - GAME.dinoX < s.speed * 24;
      const jump = !!o && (o.kind === "low" || o.kind === "candle") && s.y === 0 && o.x - GAME.dinoX < s.speed * 14;
      if (jump) jumps.push(s.tick);
      if (duck !== s.duckHeld) ducks.push(s.tick);
      step(s, jump, duck);
    }
    assert.equal(s.dead, false, `seed ${seed}, tick ${s.tick}`);
    assert.equal(s.speed, GAME.maxSpeed);
    assert.ok(ducks.length > 0);
    assert.deepEqual(replay(seed, s.tick, jumps, ducks), s);
    const verified = validateRun({ ...ticket, seed }, { ticks: s.tick, inputs: jumps, ducks, reason: "interrupted" }, start + s.tick * 1000 / GAME.hz + 100);
    assert.equal(verified.score, s.score);
  }
});
test("malformed duck logs, too many combined inputs and unknown versions are rejected", () => {
  for (const ducks of [[5, 5], [7, 3], [-1], [100], [2.5], null, {}]) {
    assert.throws(() => replay(1, 100, [], ducks as number[]));
  }
  assert.throws(() => replay(1, 4000, Array.from({ length: 3100 }, (_, i) => i), Array.from({ length: 3100 }, (_, i) => i)));
  assert.throws(() => replay(1, 50, [], [], "99.0.0"));
});
test("pending classic tickets retain their original physics and reject duck inputs", () => {
  const legacy = replayV1(1, 240, []);
  assert.deepEqual(replay(1, 240, [], [], "1.0.0"), { ...createGame(1, "1.0.0"), ...legacy });
  const result = validateRun({ ...ticket, version: "1.0.0" }, { ticks: 240, inputs: [], reason: "interrupted" }, start + 4100);
  assert.equal(result.score, legacy.score);
  assert.throws(() => replay(1, 50, [], [1], "1.0.0"), /does not support/);
});
test("a replay collision cannot be submitted as an interruption", () => {
  const s = createGame(1);
  while (!s.dead) step(s);
  assert.throws(() => validateRun(ticket, { ticks: s.tick, inputs: [], reason: "interrupted" }, start + s.tick * 1000 / GAME.hz + 100), /collision must/i);
});
test("owner review handles classic, duck-enabled, expired and malformed logs", () => {
  assert.equal(inputSummary("[1,2]"), "2 jumps · classic");
  assert.equal(inputSummary('{"jumps":[1],"ducks":[2,5,8]}'), "1 jump · 2 duck holds");
  assert.equal(inputSummary(null), "Input log expired");
  assert.equal(inputSummary("bad"), "Input log unavailable");
  assert.equal(inputSummary("{}"), "Input log unavailable");
});

test("pre-season rollout preserves seed, scores and pending classic runs; finalized days stay pinned", () => {
  const db = database();
  db.prepare("INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,77,'1.0.0',?)").run(ticket.day, ticket.closesAt);
  insert(db, "old-best", "wallet-a", 123, start);
  db.exec("INSERT INTO runs(id,day,session,wallet,name,seed,version,start_at,status) VALUES ('pending','2026-09-28','s','b','Dino',77,'1.0.0',0,'active')");
  db.prepare(ADVANCE_PRESEASON_VERSION).run(GAME.version, ticket.day);
  const day = db.prepare("SELECT * FROM competition_days WHERE day=?").get(ticket.day)!;
  assert.equal(day.seed, 77); assert.equal(day.version, GAME.version);
  assert.equal(db.prepare("SELECT score FROM daily_best").get()!.score, 123);
  assert.equal(db.prepare("SELECT version FROM runs WHERE id='pending'").get()!.version, "1.0.0");
  db.exec("UPDATE competition_days SET version='1.0.0',finalized_at=1");
  db.prepare(ADVANCE_PRESEASON_VERSION).run(GAME.version, ticket.day);
  assert.equal(db.prepare("SELECT version FROM competition_days").get()!.version, "1.0.0");
  db.close();
});

test("packaged initial migration safely follows runtime bootstrap without data loss", () => {
  const database = new DatabaseSync(":memory:"), sql = readFileSync("drizzle/0000_cute_madame_hydra.sql", "utf8");
  for (const statement of initialSchemaStatements(sql)) database.exec(statement);
  database.exec("INSERT INTO competition_days(day,seed,version,closes_at) VALUES ('2026-09-28',88,'1.0.0',1790640000000)");
  database.exec(sql);
  database.exec(sql);
  assert.equal(database.prepare("SELECT seed FROM competition_days").get()!.seed, 88);
  assert.equal(database.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get()!.n, 6);
  database.close();
});

test("personal record is scoped to its wallet and UTC day across midnight and identity changes", () => {
  const record = { wallet: "0xabcdef", day: "2026-09-28", score: 900, rank: 2 };
  assert.deepEqual(personalStanding(record, "0xABCDEF", "2026-09-28"), { score: 900, rank: 2 });
  assert.deepEqual(personalStanding(record, "0xabcdef", "2026-09-29"), { score: 0, rank: null });
  assert.deepEqual(personalStanding(record, "0x123456", "2026-09-28"), { score: 0, rank: null });
  assert.deepEqual(personalStanding(null, "0xabcdef", "2026-09-28"), { score: 0, rank: null });
});
test("late lookup cannot overwrite a new result or roll the leaderboard back to yesterday", async () => {
  let resolveOld!: (value: number) => void;
  const oldLookup = new Promise<number>((resolve) => { resolveOld = resolve; });
  let latest = 1, shown = 100;
  const request = latest;
  const completion = oldLookup.then((score) => {
    if (isCurrentResponse(request, latest, "2026-09-28", "2026-09-28")) shown = score;
  });
  latest++; shown = 500;
  resolveOld(100); await completion;
  assert.equal(shown, 500);
  assert.equal(isCurrentResponse(2, 2, "2026-09-28", "2026-09-29"), false);
  assert.equal(isCurrentResponse(2, 2, "2026-09-29", "2026-09-29"), true);
});
function applyReview(db: DatabaseSync, id: string, wallet: string, operationId: string, at: number) {
  db.exec("BEGIN");
  try {
    for (const { sql, params } of reviewStatements({ id, wallet, operationId, at, day: ticket.day, actor: "owner", reason: "Verified QA violation" })) db.prepare(sql).run(...params);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
test("duplicate review claims exclude once, restore the wallet's next best and preserve result revisions", () => {
  const db = database();
  db.prepare("INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,?,?)").run(ticket.day, GAME.version, ticket.closesAt);
  insert(db, "backup", "a", 200, 10);
  insert(db, "winner", "a", 800, 20);
  insert(db, "runner-b", "b", 400, 30);
  const now = ticket.closesAt + 61000;
  db.prepare(FINALIZE_SNAPSHOT).run(ticket.day, 60000, now);
  db.prepare(FINALIZE_DAY).run(now, ticket.day, 60000, now);
  applyReview(db, "winner", "a", "claim-1", now);
  applyReview(db, "winner", "a", "claim-2", now);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM audit_events").get()!.n, 1);
  assert.equal(db.prepare("SELECT revision FROM competition_days").get()!.revision, 2);
  assert.equal(db.prepare("SELECT run_id FROM daily_best WHERE wallet='a'").get()!.run_id, "backup");
  assert.equal(db.prepare("SELECT run_id FROM daily_results WHERE revision=1 AND rank=1").get()!.run_id, "winner");
  assert.equal(db.prepare("SELECT run_id FROM daily_results WHERE revision=2 AND rank=1").get()!.run_id, "runner-b");
  db.close();
});
test("review before cutoff updates live records without publishing premature winners", () => {
  const db = database();
  db.prepare("INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,?,?)").run(ticket.day, GAME.version, ticket.closesAt);
  insert(db, "only-run", "a", 500, 10);
  applyReview(db, "only-run", "a", "live-claim", ticket.startAt + 10000);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM daily_best").get()!.n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM daily_results").get()!.n, 0);
  assert.equal(db.prepare("SELECT finalized_at FROM competition_days").get()!.finalized_at, null);
  db.close();
});
