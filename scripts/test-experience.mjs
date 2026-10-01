import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
await mkdir(".sites-runtime", { recursive: true });
await build({ entryPoints: ["tests/experience.test.ts"], outfile: ".sites-runtime/experience.test.mjs", bundle: true, platform: "node", format: "esm", target: "node22", packages: "external" });
const result = spawnSync(process.execPath, ["--test", ".sites-runtime/experience.test.mjs"], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
