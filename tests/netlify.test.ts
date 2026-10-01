import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { postgresDatabase, postgresSql, type SqlPool } from "../lib/postgres";
import { initialSchemaStatements } from "../lib/database-bootstrap";
import { UPSERT_BEST, FINALIZE_DAY, FINALIZE_SNAPSHOT } from "../lib/queries";
import { reviewStatements } from "../lib/review";
import { verifyOwnerCredentials } from "../lib/owner-credentials";
import { isAllowedOrigin } from "../lib/request-origin";

test("public platform origin is accepted behind Next's internal host while foreign origins stay denied", () => {
  const internal = "http://localhost:3000/api/runs", publicUrl = "https://dino404.netlify.app";
  assert.equal(isAllowedOrigin(internal, publicUrl, [publicUrl]), true);
  assert.equal(isAllowedOrigin(internal, "https://attacker.example", [publicUrl]), false);
  assert.equal(isAllowedOrigin(internal, publicUrl + ".attacker.example", [publicUrl]), false);
  assert.equal(isAllowedOrigin(internal, "null", [publicUrl]), false);
  assert.equal(isAllowedOrigin(internal, publicUrl, [undefined,"invalid"]), false);
});

async function fixture() {
  const pg = new PGlite();
  let tail = Promise.resolve();
  const pool: SqlPool = { async connect() {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    return { release, async query(sql, params) {
      const result = await pg.query<Record<string, unknown>>(sql, params);
      return { rows: result.rows, rowCount: result.affectedRows };
    } };
  } };
  const db = postgresDatabase(pool);
  const source = readFileSync("drizzle/0000_cute_madame_hydra.sql", "utf8");
  await db.batch(initialSchemaStatements(source).map(sql => db.prepare(sql)));
  return { db, pg };
}

test("Postgres migration preserves all tables and millisecond/uint32 integers", async () => {
  const { db, pg } = await fixture();
  try {
    await pg.exec(readFileSync("netlify/database/migrations/0001_dino404.sql", "utf8"));
    await db.prepare("INSERT OR IGNORE INTO competition_days(day,seed,version,closes_at) VALUES (?,?,?,?)").bind("2026-10-01", 4294967295, "3.0.0", 1790899200000).run();
    await db.prepare("INSERT OR IGNORE INTO competition_days(day,seed,version,closes_at) VALUES (?,?,?,?)").bind("2026-10-01", 1, "3.0.0", 1).run();
    const day = await db.prepare("SELECT seed,closes_at FROM competition_days WHERE day=?").bind("2026-10-01").first();
    assert.deepEqual(day, { seed: 4294967295, closes_at: 1790899200000 });
    const rows = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    assert.equal(rows.rows.length, 6);
  } finally { await pg.close(); }
});

test("Postgres parameterization preserves quoted question marks and rate limiting increments", async () => {
  assert.equal(postgresSql("SELECT '?' AS label WHERE id=? AND name='a''?b'"), "SELECT '?' AS label WHERE id=$1 AND name='a''?b'");
  const { db, pg } = await fixture();
  try {
    const sql = "INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count";
    const key = "a'); DROP TABLE runs; --";
    assert.deepEqual(await db.prepare(sql).bind(key, 1790899200000).first(), { count: 1 });
    assert.deepEqual(await db.prepare(sql).bind(key, 1790899200000).first(), { count: 2 });
    assert.equal((await db.prepare("SELECT * FROM rate_limits").all()).results.length, 1);
    assert.equal((await db.prepare("SELECT * FROM runs").all()).results.length, 0);
  } finally { await pg.close(); }
});

test("Postgres rolls back an entire score batch when a later statement fails", async () => {
  const { db, pg } = await fixture();
  try {
    await assert.rejects(db.batch([
      db.prepare("INSERT INTO competition_days(day,seed,version,closes_at) VALUES ('rollback',1,'3.0.0',1)"),
      db.prepare("INSERT INTO missing_table(id) VALUES (1)"),
    ]));
    assert.equal(await db.prepare("SELECT * FROM competition_days WHERE day='rollback'").first(), null);
  } finally { await pg.close(); }
});

test("Postgres best score, tie order, final top three and duplicate reviews retain original semantics", async () => {
  const { db, pg } = await fixture();
  try {
    const day = "2000-01-02", at = 946900000000;
    await db.prepare("INSERT INTO competition_days(day,seed,version,closes_at) VALUES (?,1,'3.0.0',946857600000)").bind(day).run();
    for (const [id, wallet, score, achieved] of [["a1","a",500,10],["a2","a",480,15],["a3","a",500,20],["b1","b",500,11],["c1","c",400,12],["d1","d",300,13]] as const) {
      await db.batch([
        db.prepare("INSERT INTO runs(id,day,session,wallet,name,seed,version,start_at,status,score,achieved_at) VALUES (?,?,'test',?, ?,1,'3.0.0',0,'accepted',?,?)").bind(id, day, wallet, id, score, achieved),
        db.prepare(UPSERT_BEST).bind(id),
      ]);
    }
    assert.equal((await db.prepare("SELECT run_id FROM daily_best WHERE wallet='a'").first())?.run_id, "a1");
    await db.batch([db.prepare(FINALIZE_SNAPSHOT).bind(day,60000,at),db.prepare(FINALIZE_DAY).bind(at,day,60000,at)]);
    assert.deepEqual((await db.prepare("SELECT wallet,rank FROM daily_results ORDER BY rank").all()).results, [{wallet:"a",rank:1},{wallet:"b",rank:2},{wallet:"c",rank:3}]);
    await Promise.all(["review1","review2","review3"].map(operationId => db.batch(reviewStatements({id:"a1", day, wallet:"a", operationId, at:at+1, actor:"DINO404", reason:"QA invalid run"}).map(s=>db.prepare(s.sql).bind(...s.params)))));
    assert.equal((await db.prepare("SELECT * FROM audit_events").all()).results.length,1);
    assert.equal((await db.prepare("SELECT revision FROM competition_days").first())?.revision,2);
    assert.equal((await db.prepare("SELECT run_id FROM daily_best WHERE wallet='a'").first())?.run_id,"a3");
    assert.deepEqual((await db.prepare("SELECT wallet FROM daily_results WHERE revision=2 ORDER BY rank").all()).results,[{wallet:"b"},{wallet:"a"},{wallet:"c"}]);
  } finally { await pg.close(); }
});

test("Netlify owner access rejects missing configuration, malformed credentials and wrong passwords", async () => {
  const secret = "test-only-" + "x".repeat(48);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret))),n=>n.toString(16).padStart(2,"0")).join("");
  const header = "Basic " + btoa("dino404found:" + secret);
  assert.equal(await verifyOwnerCredentials(header,digest),true);
  for (const candidate of [null,"Basic !!!","Bearer token","Basic "+btoa("other:"+secret),"Basic "+btoa("dino404found:"+"y".repeat(48))]) assert.equal(await verifyOwnerCredentials(candidate,digest),false);
  assert.equal(await verifyOwnerCredentials(header,undefined),false);
  assert.equal(await verifyOwnerCredentials(header,"bad hash"),false);
});
