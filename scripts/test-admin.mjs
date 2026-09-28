import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.TEST_ORIGIN ?? "http://localhost:5173";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("Admin tests run locally only.");
const date = "2000-01-02",
  prefix = "qa-csv-";
await mkdir(".sites-runtime", { recursive: true });
const sql = [
  "INSERT OR IGNORE INTO competition_days(day,seed,version,closes_at) VALUES ('2000-01-02',1,'qa-fixture',946857600000)",
];
for (let i = 1; i <= 4; i++) {
  sql.push(
    `INSERT OR IGNORE INTO runs(id,day,session,wallet,name,seed,version,start_at,status,score,achieved_at,ticks,input_log,reason) VALUES ('${prefix + i}','${date}','qa-session','0x${String(i).repeat(40)}','QA Dino ${i}',1,'qa-fixture',946800000000,'accepted',${500 - i * 10},${946800000000 + i * 1000},120,'[]','interrupted')`,
  );
  sql.push(
    `INSERT OR IGNORE INTO daily_best(day,wallet,name,score,achieved_at,run_id) SELECT day,wallet,name,score,achieved_at,id FROM runs WHERE id='${prefix + i}'`,
  );
}
await writeFile(".sites-runtime/qa-export.sql", sql.join(";\n") + ";");
function apply(file) {
  const r = spawnSync(
    process.execPath,
    [
      "--import",
      "./scripts/sites-env.mjs",
      "node_modules/wrangler/bin/wrangler.js",
      "d1",
      "execute",
      "DB",
      "--local",
      "--config",
      "dist/server/wrangler.json",
      "--persist-to",
      ".wrangler/state",
      "--file",
      file,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
}
apply(".sites-runtime/qa-export.sql");
const login = await fetch(base + "/signin-with-chatgpt?return_to=/admin", {
  redirect: "manual",
});
const cookie = login.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "local mock sign-in cookie");
const checks = [];
try {
  let r = await fetch(base + `/api/admin/results/${date}`, {
    headers: { Cookie: cookie },
  });
  let data = await r.json();
  assert.equal(r.status, 200);
  assert.ok(data.info.finalized_at);
  assert.equal(data.entries.length, 4);
  checks.push("owner can review a finalized historical day");
  r = await fetch(base + `/api/admin/results/${date}/export`, {
    headers: { Cookie: cookie },
  });
  const csv = await r.text();
  assert.equal(r.status, 200);
  assert.ok(r.headers.get("content-disposition").includes("r1.csv"));
  assert.equal(csv.trim().split("\r\n").length, 4);
  assert.ok(csv.includes("0x" + "1".repeat(40)));
  checks.push("CSV includes exactly the top 3 and full receiving wallets");
  await writeFile(".sites-runtime/verified-sample.csv", csv);
  r = await fetch(base + `/api/admin/runs/${prefix}1/review`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: base,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "QA fixture exclusion to test result revision.",
    }),
  });
  assert.equal(r.status, 200);
  checks.push("review action accepts a reason and recalculates results");
  r = await fetch(base + `/api/admin/results/${date}`, {
    headers: { Cookie: cookie },
  });
  data = await r.json();
  assert.equal(data.info.revision, 2);
  assert.equal(data.entries[0].name, "QA Dino 2");
  assert.equal(data.audit.length, 1);
  checks.push("revised winners and audit log are persisted");
  r = await fetch(base + `/api/admin/results/${date}/export`, {
    headers: { Cookie: cookie },
  });
  const revised = await r.text();
  assert.ok(r.headers.get("content-disposition").includes("r2.csv"));
  assert.ok(!revised.includes('"QA Dino 1"'));
  checks.push("revised CSV uses new revision and excludes invalidated run");
  r = await fetch(
    base + `/api/admin/results/${new Date().toISOString().slice(0, 10)}/export`,
    { headers: { Cookie: cookie } },
  );
  assert.equal(r.status, 409);
  checks.push("current UTC day cannot export premature winners");
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  // Remove only the explicitly named QA fixture, never current player records.
  await writeFile(
    ".sites-runtime/qa-clean.sql",
    `DELETE FROM audit_events WHERE target IN ('qa-csv-1','qa-csv-2','qa-csv-3','qa-csv-4'); DELETE FROM daily_results WHERE day='2000-01-02'; DELETE FROM daily_best WHERE day='2000-01-02'; DELETE FROM runs WHERE id IN ('qa-csv-1','qa-csv-2','qa-csv-3','qa-csv-4'); DELETE FROM competition_days WHERE day='2000-01-02' AND version='qa-fixture';`,
  );
  apply(".sites-runtime/qa-clean.sql");
}
