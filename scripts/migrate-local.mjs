import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
if(!existsSync("dist/server/wrangler.json"))throw new Error("Run npm run build before applying local migrations.");
await mkdir(".sites-runtime",{recursive:true});
const marker=".sites-runtime/local-migrations.json";
let applied=[];try{applied=JSON.parse(await readFile(marker,"utf8"));}catch{}
const files=(await readdir("drizzle")).filter(x=>x.endsWith(".sql")).sort();
for(const file of files){if(applied.includes(file))continue;
  const result=spawnSync(process.execPath,["--import","./scripts/sites-env.mjs","node_modules/wrangler/bin/wrangler.js","d1","execute","DB","--local","--config","dist/server/wrangler.json","--persist-to",".wrangler/state","--file","drizzle/"+file],{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status??1);applied.push(file);await writeFile(marker,JSON.stringify(applied,null,2));
}
console.log("Local migrations are up to date.");
