# DINO404 on Netlify

The Netlify target runs the complete Next.js application, including run tickets, deterministic server replay, daily rankings, owner review and CSV. It is a separate deployment from the previous Sites preview. Gameplay remains version 3.0.0; rewards remain disabled until the owner configures and announces them.

## Project and identity

Production setup was added on 3 October 2026: `dino404.xyz` and `www.dino404.xyz` are assigned to this project, with a production deployment, separate main database and valid HTTPS. See [PRODUCTION-LAUNCH.md](PRODUCTION-LAUNCH.md) for verification. The preview-only delivery section below describes the earlier release.

- Public source: https://github.com/dino404found/dino404
- Netlify project: `dino404`, owned by the DINO404 team.
- Verified stable draft URL: https://preview--dino404.netlify.app
- `main` is pushed with the repository-local DINO404 Git identity. Global Git identity is unchanged. `.mailmap` attributes earlier DINO404 placeholder-email commits without rewriting history.
- MIT covers the project source; Chromium and other bundled components retain their original license notices.

## Setup and deployment

Use Node.js 22.13+ and Netlify CLI 26+. From the repository root:

```powershell
npm ci
netlify login
netlify link
netlify dev
```

`netlify.toml` runs `npm run build:netlify`, publishes `.next`, and lets Netlify's Next adapter package the dynamic routes. `@netlify/database` and the SQL migrations in `netlify/database/migrations` enable managed Postgres provisioning and schema application. Never upload only static assets: that would omit score validation and owner operations.

Configure these environment variables in the Netlify project before deployment:

| Variable | Value or purpose |
| --- | --- |
| `APP_ORIGIN` | `https://dino404.xyz` in production; `https://preview--dino404.netlify.app` in preview contexts |
| `ADMIN_PASSWORD_SHA256` | SHA-256 hex digest of a random, private 32+ character password |
| `ADMIN_EMAIL` | Owner identity displayed in audit records |
| `REWARDS_ENABLED` | `false` during pre-season |

The platform supplies the database connection. Never commit environment values, connection strings or the owner password. `.netlify/`, `.sites-runtime/` and private environment files are ignored by Git.

`APP_ORIGIN` also supplies the canonical and Open Graph/Twitter image URLs. Set it in the build environment as well as Functions; the homepage metadata is prerendered. Previews emit `noindex, nofollow`. Indexing is enabled only when Netlify's `CONTEXT=production` and `APP_ORIGIN` is HTTPS on `dino404.xyz` or `www.dino404.xyz`. The public homepage remains crawlable so share crawlers can read the card and search crawlers can read `noindex`; robots rules exclude API and owner routes. Robots directives do not replace owner authentication.

Before publishing the real domain: configure DNS and HTTPS in Netlify, set the production-context `APP_ORIGIN` to the chosen canonical custom domain, select the correct production database/retention settings, and verify a real production run and owner access on that origin. Keep the preview-context origin pointing at the preview. Rebuild after changing the origin, then verify the generated canonical and share image URLs. Rewards remain disabled until the owner supplies their separate configuration. GitHub auto-deploy still requires linking the repository.

Dependency patches from the 2 October audit keep Next at 16.3.8, React/React DOM/RSC together at 19.2.8, and Vite at 8.0.16. Explicit compatible tool overrides pin patched `ws`, `undici`, `image-size`, and `esbuild`, including transitive versions pinned by older build tools. Re-evaluate these overrides when upgrading the parent tools. Both framework builds and regression suites must pass after dependency changes; do not use a forced audit fix that downgrades Drizzle.

```powershell
netlify deploy --alias preview --context deploy-preview
```

This creates a draft preview; it does not switch the production URL or configure `dino404.xyz`. CLI deployments do not by themselves establish GitHub auto-deploy. Check the Netlify project's repository connection before relying on push-triggered builds. Database branch lifecycle is managed by Netlify, so use production configuration for a real competition and check branch retention before reusing preview data.

## Owner access

Open `/owner-login` over HTTPS. The browser asks for username `dino404found` and the private owner password. Successful authentication opens `/admin`. The browser reuses the credentials for protected same-origin API/CSV requests.

Use a private browser window for owner work and close it afterwards to clear its authentication session. Netlify access does not use the old Sites ChatGPT sign-in. A missing hash denies access; spoofed Sites headers do not grant it. The server stores only the SHA-256 hash of the randomly generated password, not its plaintext. Rotate by generating a new random secret, replacing the configured hash, and redeploying.

Select a UTC date, review runs and download that day's final top-three CSV. Current-day export is blocked. Excluding a run requires a reason and creates an audit entry and revised results; repeat/concurrent requests must not create additional exclusions.

## Database compatibility

- Six application tables and their indexes preserve the existing model. Millisecond timestamps and unsigned daily seeds use Postgres `bigint`; the adapter safely converts known integer result columns to JavaScript numbers.
- Values stay bound parameters. The adapter translates only the SQL dialect used by this application, including `?` placeholders and `INSERT OR IGNORE`; it is not a general SQLite emulator.
- Batches run on one checked-out connection inside a transaction. `pg_advisory_xact_lock(4042026)` serializes score/finalization/review batches across function instances, preserving the original D1 write semantics. Failures roll back the whole batch.
- Each warm function pool is limited to one connection. Separate instances still coordinate through the database lock. This favors correctness and controlled connection usage; high-volume throughput has not been load-tested.
- Sites D1 and Netlify Postgres are separate. Existing Sites scores are not migrated automatically. Future schema updates require explicit migrations for each supported runtime.
- Next's public URL validation accepts configured deployment origins behind its internal proxy, rejects foreign origins, and uses Netlify's client IP header for IP limits. Netlify owner access does not trust Sites identity headers.

## Verification

```powershell
npm test
npm run test:netlify
npm run build:netlify
npm run test:netlify:api
npm run lint
npm run typecheck
```

The local API suite starts a production Next server and an ephemeral Netlify Postgres emulator. It runs public API checks plus owner authentication, historical finalization, full-wallet top-three CSV, concurrent exclusion, revision and current-day export checks. Test credentials and data are generated only inside the temporary test environment.

The emulator shares one PGlite backend across wire clients; the connection limit prevents interleaved transactions in that environment. Emulator success alone does not prove cross-instance Postgres locking. On 1 October 2026, the preview's actual managed Postgres passed concurrent finalization and review through three independent pools, plus rollback and wallet fallback/tie ordering. This used an isolated temporary QA schema that was removed afterwards.

`npm run build` verifies the retained Worker target. Run the two framework builds sequentially: both generate `.next/types`. `npm run typecheck` regenerates Next route types before TypeScript checking so switching targets does not leave incompatible generated declarations.

Applied SQL files are immutable byte-for-byte. The initial preview migration ends with LF followed by CRLF; keep those bytes, even though an editor may consider the ending redundant. `.gitattributes` prevents checkout newline conversion, and `scripts/check-migrations.mjs` verifies the recorded SHA-256 before every Netlify build. Add a new migration for schema changes. See [Netlify's migration checksum guidance](https://docs.netlify.com/build/data-and-storage/netlify-database/troubleshooting/#migration-modified-after-being-applied).

## Delivery verification — 1 October 2026

- Initial draft deployment: `6abd6f6d4dae866675a58929`, Netlify status `ready`.
- 45 game/protocol tests, 6 adapter/auth/origin tests, 13 production Next API checks and 8 owner/CSV checks passed. Worker build, Netlify build, ESLint and TypeScript passed.
- The live browser completed a real no-input run: 77 points, RUN VERIFIED, rank #1. Owner results independently confirmed persistence. The synthetic QA entry was removed after verification.
- Nine live HTTP checks passed: anonymous and forged-header denial; owner challenge; valid owner sign-in and panel render; persisted browser score; current-day CSV denial; foreign-origin denial; full-wallet privacy.
- Actual Postgres concurrency used three independent connections. Duplicate finalization produced revision 1; duplicate review produced one audit event and revision 2. Rollback left no partial row.
- Desktop and 390 px mobile layouts were checked on the hosted preview; no horizontal overflow and no browser warning/error logs were observed during that run.
- Preview access is public. The owner panel is separately password-protected. `dino404.xyz`, production publication, rewards and GitHub auto-deploy are not configured by this preview delivery.
- This is functional/regression verification, not a mass-load test or proof that every possible defect is absent.
