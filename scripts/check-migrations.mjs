import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Recorded from the preview's applied migration and original deploy file digest.
// Never reformat an applied migration. Add a new file for schema changes.
const applied = {
  "0001_dino404.sql": "1ee361b1884306c1af65542a09462a2b341b2ff1c72af0b54b5dd2b42c6c7d28",
};
for (const [name, expected] of Object.entries(applied)) {
  const bytes = readFileSync(new URL(`../netlify/database/migrations/${name}`, import.meta.url));
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) throw new Error(`Applied migration ${name} changed. Restore its original bytes before deploying; use a new migration for schema changes.`);
}
console.log("Applied migration checksums match.");
