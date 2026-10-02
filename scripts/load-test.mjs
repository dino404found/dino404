// Bounded, opt-in production exercise. Never bypass rate limits or spoof client IP.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const origin = process.env.LOAD_ORIGIN;
assert.ok(['https://preview--dino404.netlify.app', 'https://dino404.xyz'].includes(origin), 'Set LOAD_ORIGIN to the approved DINO404 host.');
assert.ok(process.argv.includes('--run'), 'Pass --run explicitly to generate traffic.');
if (origin === 'https://dino404.xyz') assert.ok(process.argv.includes('--allow-production'), 'Production requires --allow-production.');
const authorization = process.env.LOAD_OWNER_AUTH;
assert.ok(authorization?.startsWith('Basic '), 'Owner authentication is required for automatic fixture exclusion.');
const id = Date.now().toString(36);
const output = `.sites-runtime/load-${id}.json`;
await mkdir('.sites-runtime', { recursive: true });
await build({entryPoints:['lib/game.ts'],outfile:'.sites-runtime/load-game.mjs',bundle:true,platform:'node',format:'esm'});
const { replay, GAME } = await import(pathToFileURL(resolve('.sites-runtime/load-game.mjs')).href);
const result = {id,origin,startedAt:new Date().toISOString(),limits:{maxConcurrency:20,requestTimeoutMs:12000,readRequests:144,runTickets:36,stopOnUnexpectedResponse:true,readP95TargetMs:2000,writeP95TargetMs:3000},stages:[],samples:[],fixtures:[],assertions:[],cleanup:[],complete:false};
const save = () => writeFile(output,JSON.stringify(result,null,2));
const delay = ms => new Promise(r=>setTimeout(r,ms));
let inFlight=0,peak=0;
async function request(path,{body,cookie,owner=false,label='probe',expected=200}={}) {
 const started=performance.now();inFlight++;peak=Math.max(peak,inFlight);
 assert.ok(inFlight<=20,'Concurrency cap');
 let status=0;
 try {
  const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{}),...(owner?{authorization}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000),redirect:'error'});
  status=r.status;const text=await r.text();const data=JSON.parse(text);
  assert.equal(status,expected,`${label}: ${status} ${data.error??''}`);
  return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
 } finally {result.samples.push({label,path:label.startsWith('read-')?path:undefined,status,ms:Math.round((performance.now()-started)*10)/10});inFlight--;}
}
function summary(samples) {
 const values=samples.map(x=>x.ms).sort((a,b)=>a-b);
 const pct=p=>values[Math.max(0,Math.ceil(values.length*p)-1)]??0;
 return {requests:values.length,p50Ms:pct(.5),p95Ms:pct(.95),maxMs:values.at(-1)??0,non2xx:samples.filter(x=>x.status<200||x.status>=300).length};
}
function expectedBest() {
 const best=new Map();
 for(const f of result.fixtures.filter(f=>f.accepted)) {
  const old=best.get(f.wallet);
  if(!old||f.score>old.score||(f.score===old.score&&(f.achievedAt<old.achievedAt||(f.achievedAt===old.achievedAt&&f.runId<old.runId)))) best.set(f.wallet,f);
 }
 return [...best.values()].sort((a,b)=>b.score-a.score||a.achievedAt-b.achievedAt||a.runId.localeCompare(b.runId));
}
try {
 const initial=await request('/api/competition');
 assert.equal(initial.data.rewards.enabled,false,'Do not create synthetic scores during an active reward season.');
 assert.ok(initial.data.closesAt-initial.data.serverNow>600000,'Do not run within ten minutes of UTC reset.');
 result.day=initial.data.day;
 await request('/api/admin/results',{owner:true});
 result.baseline=summary(result.samples);
 console.log(JSON.stringify({phase:'baseline',...result.baseline}));
 for(const concurrency of [1,5,10,20]) {
  const start=result.samples.length,t=performance.now();
  for(let round=0;round<4;round++) {
   const work=await Promise.allSettled(Array.from({length:concurrency},(_,i)=>request((round+i)%2?'/api/competition':'/api/leaderboard',{label:`read-${concurrency}`})));
   for(const item of work) {if(item.status==='rejected')throw item.reason;assert.ok(item.value.data.day===result.day);}
   await delay(300);
  }
  const stats=summary(result.samples.slice(start));
  result.stages.push({kind:'reads',concurrency,wallMs:Math.round(performance.now()-t),...stats});
  await save();console.log(JSON.stringify(result.stages.at(-1)));
  if(stats.p95Ms>5000)throw new Error('Read p95 exceeded 5s stop threshold; do not increase load.');
 }
 for(const concurrency of [1,5,10,20]) {
  const start=result.samples.length,t=performance.now(),fixtures=[];
  for(let i=0;i<concurrency;i++) {
   const wallet=concurrency===20&&i%2?fixtures[i-1].wallet:'0x'+randomBytes(20).toString('hex');
   const f={name:`Load ${id.slice(-5)} ${result.fixtures.length}`,wallet,accepted:false,excluded:false};
   fixtures.push(f);result.fixtures.push(f);
  }
  await save();
  const starts=await Promise.allSettled(fixtures.map(async f=>{
   const q=await request('/api/runs',{body:{name:f.name,wallet:f.wallet,confirmed:true},label:`start-${concurrency}`,expected:201});
   Object.assign(f,{runId:q.data.id,day:q.data.day,startAt:q.data.startAt});
   return {f,ticket:q.data,cookie:q.cookie};
  }));
  await save();
  for(const s of starts)if(s.status==='rejected')throw s.reason;
  const runs=starts.map(s=>s.value);
  // Honor the server clock/countdown; no fabricated elapsed time or client score.
  await delay(Math.max(0,...runs.map(r=>r.ticket.startAt+1700-Date.now())));
  const submits=await Promise.allSettled(runs.map(async (r,i)=>{
   const payload={ticks:concurrency===20&&i%2===0?60:90,inputs:[],ducks:[],reason:'interrupted'};
   const state=replay(r.ticket.seed,payload.ticks,[],[],r.ticket.version);
   const q=await request(`/api/runs/${r.f.runId}/submit`,{body:payload,cookie:r.cookie,label:`submit-${concurrency}`});
   assert.equal(q.data.status,'accepted');assert.equal(q.data.score,state.score);
   Object.assign(r.f,{accepted:true,score:state.score,achievedAt:Math.floor(r.ticket.startAt+state.scoreTick*1000/GAME.hz)});
   return {...r,payload,score:q.data.score};
  }));
  await save();for(const s of submits)if(s.status==='rejected')throw s.reason;
  // Retry the accepted requests together. They must not create extra runs/bests.
  const retries=await Promise.allSettled(submits.map(s=>request(`/api/runs/${s.value.f.runId}/submit`,{body:s.value.payload,cookie:s.value.cookie,label:`retry-${concurrency}`})));
  retries.forEach((s,i)=>{if(s.status==='rejected')throw s.reason;assert.equal(s.value.data.score,submits[i].value.score);});
  const stats=summary(result.samples.slice(start));
  result.stages.push({kind:'gameplay',concurrency,wallMs:Math.round(performance.now()-t),...stats});
  await save();console.log(JSON.stringify(result.stages.at(-1)));
  if(stats.p95Ms>5000)throw new Error('Gameplay p95 exceeded 5s stop threshold; do not increase load.');
 }
 const owner=(await request(`/api/admin/results/${result.day}`,{owner:true,label:'consistency'})).data;
 const actual=owner.entries.filter(e=>result.fixtures.some(f=>f.wallet===e.wallet));
 const expected=expectedBest();
 assert.equal(new Set(actual.map(e=>e.wallet)).size,actual.length);
 const visibleExpected=expected.filter(f=>actual.some(e=>e.wallet===f.wallet));
 actual.forEach((e,i)=>{assert.equal(e.wallet,visibleExpected[i].wallet);assert.equal(e.score,visibleExpected[i].score);assert.equal(e.run_id,visibleExpected[i].runId);});
 // Owner/public board returns only top ten. Verify every test wallet separately.
 for(let offset=0;offset<expected.length;offset+=5) {
  const checks=await Promise.allSettled(expected.slice(offset,offset+5).map(async f=>{
   const q=await request('/api/player',{body:{wallet:f.wallet},label:'consistency'});assert.equal(q.data.score,f.score);
  }));for(const c of checks)if(c.status==='rejected')throw c.reason;
 }
 result.assertions.push('All generated scores match deterministic replay','Every retry returns the accepted score','One row per visible synthetic wallet','Every synthetic wallet retains its highest score','Visible synthetic ranking follows score and verified achievement time');
 result.complete=true;
} catch(e) {result.error=e.message;console.error(e.message);process.exitCode=1;}
finally {
 // Existing authenticated review removes only exact ticket IDs generated above.
 // Leave audit trail; never delete real-player data or change DB permissions.
 for(const f of result.fixtures.filter(f=>f.runId)) {
  try {
   const q=await request(`/api/admin/runs/${f.runId}/review`,{owner:true,label:'cleanup',body:{reason:`Synthetic bounded traffic test ${id}; exclude fixture from public competition.`}});
   assert.equal(q.data.status,'excluded');f.excluded=true;result.cleanup.push({runId:f.runId,excluded:true});
  } catch(e) {result.cleanup.push({runId:f.runId,error:e.message});process.exitCode=1;}
  await save();
 }
 try {
  const q=await request(`/api/admin/results/${result.day}`,{owner:true,label:'recovery'});
  assert.ok(!q.data.entries.some(e=>result.fixtures.some(f=>f.wallet===e.wallet)),'Synthetic wallets must be absent after cleanup');
  result.assertions.push('No synthetic wallet remains on leaderboard after review');
  result.recovery=summary(result.samples.filter(s=>s.label==='recovery'));
 } catch(e) {result.recoveryError=e.message;process.exitCode=1;}
 result.peakInFlight=peak;result.finishedAt=new Date().toISOString();result.summary=summary(result.samples);
 result.latencyTargetsMet=result.stages.length===8&&result.stages.every(s=>s.p95Ms<=(s.kind==='reads'?2000:3000));
 await save();
 console.log(JSON.stringify({output,complete:result.complete,latencyTargetsMet:result.latencyTargetsMet,peakInFlight:peak,summary:result.summary,assertions:result.assertions,cleanupFailures:result.cleanup.filter(x=>!x.excluded).length}));
}
