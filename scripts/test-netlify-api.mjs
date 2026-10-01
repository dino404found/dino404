import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { NetlifyDB } from "@netlify/database-dev";

const database = new NetlifyDB({ logger: () => {} });
const connectionString = await database.start();
await database.applyMigrations("netlify/database/migrations");
const secret = randomBytes(32).toString("hex");
const base = "http://127.0.0.1:3187";
const authorization = "Basic " + Buffer.from("dino404found:" + secret).toString("base64");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3187"], {
  env: { ...process.env, APP_ORIGIN: base, NETLIFY_DB_URL: connectionString, NETLIFY_DB_DRIVER: "server", ADMIN_PASSWORD_SHA256: createHash("sha256").update(secret).digest("hex"), NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", b => { output += b; }); child.stderr.on("data", b => { output += b; });
const checks = [];
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + "/api/competition")).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, "Production Next server should become ready with the local Netlify database");
  const api = spawn(process.execPath, ["scripts/test-api.mjs"], { env: { ...process.env, TEST_ORIGIN: base }, stdio: "inherit" });
  assert.equal(await new Promise(resolve => api.on("exit", resolve)), 0, "Public API regression suite");
  let response = await fetch(base + "/api/admin/results", { headers: { "oai-authenticated-user-id": "local_seedy", "oai-authenticated-user-email": "owner@example.test" } });
  assert.equal(response.status, 401); checks.push("Forged Sites owner headers cannot access Netlify admin");
  response = await fetch(base + "/owner-login", { redirect: "manual" });
  assert.equal(response.status, 401); assert.match(response.headers.get("www-authenticate"), /DINO404 owner/); checks.push("Owner login issues an authentication challenge");
  response = await fetch(base + "/owner-login", { headers: { authorization }, redirect: "manual" });
  assert.equal(response.status, 303); checks.push("Valid owner credentials lead to admin");
  const day = "2000-01-02";
  await database.query("INSERT INTO competition_days(day,seed,version,closes_at) VALUES ($1,1,'3.0.0',946857600000)",[day]);
  for (let i = 1; i <= 4; i++) {
    await database.query("INSERT INTO runs(id,day,session,wallet,name,seed,version,start_at,status,score,achieved_at,ticks,input_log,reason) VALUES ($1,$2,'qa',$3,$4,1,'3.0.0',946800000000,'accepted',$5,$6,120,'[]','interrupted')",["qa-netlify-"+i,day,"0x"+String(i).repeat(40),"QA Dino "+i,500-i*10,946800000000+i*1000]);
    await database.query("INSERT INTO daily_best(day,wallet,name,score,achieved_at,run_id) SELECT day,wallet,name,score,achieved_at,id FROM runs WHERE id=$1",["qa-netlify-"+i]);
  }
  response = await fetch(base + `/api/admin/results/${day}`,{headers:{authorization}});
  const initial = await response.json(); assert.equal(response.status,200); assert.equal(initial.entries.length,4); assert.equal(initial.info.revision,1); checks.push("Owner sees finalized historical results on Postgres");
  response = await fetch(base + `/api/admin/results/${day}/export`,{headers:{authorization}});
  const csv = await response.text(); assert.equal(response.status,200); assert.equal(csv.trim().split("\r\n").length,4); assert.ok(csv.includes("0x"+"1".repeat(40))); checks.push("CSV contains exactly top 3 with complete wallets");
  const review = () => fetch(base + "/api/admin/runs/qa-netlify-1/review",{method:"POST",headers:{authorization,Origin:base,"Content-Type":"application/json"},body:JSON.stringify({reason:"QA confirmed invalid run input"})});
  const reviews = await Promise.all([review(),review(),review()]); for (const r of reviews) assert.equal(r.status,200);
  response = await fetch(base + `/api/admin/results/${day}`,{headers:{authorization}});
  const revised = await response.json(); assert.equal(revised.info.revision,2); assert.equal(revised.audit.length,1); assert.equal(revised.entries.length,3); checks.push("Concurrent reviews record one exclusion and one revision");
  response = await fetch(base + `/api/admin/results/${day}/export`,{headers:{authorization}});
  const revisedCsv = await response.text(); assert.ok(!revisedCsv.includes("qa-netlify-1")); assert.match(response.headers.get("content-disposition"), /r2/); checks.push("Revised CSV excludes the reviewed run");
  const today = new Date().toISOString().slice(0,10);
  response = await fetch(base + `/api/admin/results/${today}/export`,{headers:{authorization}}); assert.equal(response.status,409); checks.push("Live day cannot export premature winners");
  console.log(JSON.stringify({ ownerChecksPassed: checks.length, checks },null,2));
} catch (error) {
  console.error(output.replace(/postgres(?:ql)?:\/\/[^\s]+/g,"[local database URL]"));
  throw error;
} finally {
  child.kill();
  await database.stop();
}
