import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
await mkdir(".sites-runtime", { recursive: true });
await build({
  entryPoints: ["tests/core.test.ts"],
  outfile: ".sites-runtime/core.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
});
const result = spawnSync(
  process.execPath,
  ["--test", ".sites-runtime/core.test.mjs"],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
