# DINO404

**Run to reconnect.** Open-source pixel runner by [DINO404](https://github.com/dino404found).

Project code is available under the [MIT License](LICENSE). Chromium assets and bundled third-party code retain their respective notices in [ASSETS.md](ASSETS.md), `public/CHROMIUM-LICENSE.txt`, `build/sites-vite-plugin.LICENSE`, and `vendor/shadcn-tailwind-4.13.0.LICENSE.md`. The package is marked private only to prevent accidental npm publication; the GitHub repository is public.

Classic pixel runner, green candlestick obstacles, a daily UTC leaderboard, server replay validation, and private top-3 CSV exports. The product specification is in [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md), copied from the workspace masterplan. Implementation decisions and verification are recorded in [`IMPLEMENTATION.md`](IMPLEMENTATION.md).

## Gameplay 3.0 — Signal Gate

Jump through optional four-corner signal gates for **+20** each. The first gate sits above the first candle; missing it has no penalty. Four collected gates restore the world's relay lights. The four-square dino badge, short pixel trail and SIGNAL FOUND feedback tie the game to the DINO404 identity. Distance and gate bonuses both contribute to the server-verified score.

- Space / Arrow Up, tapping the arena, or Jump: single jump.
- Hold Arrow Down / S or the Duck button: duck. Down while airborne lands faster; releasing restores standing.
- Green candles and low drones: jump. Mid-height drones: duck. High drones: stay on the ground.
- The third obstacle introduces a mid-height drone, the fifth a low drone, and the eighth a high drone. Short on-screen cues teach the heights.
- Green Valley, Signal Ridge, and Market District cycle every 7,000 distance units with a gradual palette transition. Scenery has no hitboxes or score bonuses. Reduced motion freezes decorative parallax and removes dust/clear effects.

## Page atmosphere and sound

A moving mint/lime signal field surrounds the page: relay frames, travelling signal pixels and a quiet dot grid. The reading area stays light, and decoration recedes while playing. Device reduced-motion settings and the **Motion** control pause decorative movement.

An original soft 84 BPM pixel soundtrack starts with the run, after the player's Start gesture. Jump, duck, gates, score milestones and collision have short sound cues. **Music**, **FX** and volume are independent controls above the arena; preferences persist in the browser, with a moderate 45% default volume. Sound stops when the run ends or the page loses focus. No audio files, external audio libraries or autoplay on page load are required.

Section links scroll within the page while keeping a clean URL. Existing `/#` and known section links are handled on arrival. See [`docs/ATMOSPHERE-AUDIO.md`](docs/ATMOSPHERE-AUDIO.md) for implementation and verification details.

The 2 October pre-launch audit adds Web Audio compatibility and lifecycle fixes, clearer mobile instructions and season status, and a static branded share card. See [`docs/PRELAUNCH-AUDIT.md`](docs/PRELAUNCH-AUDIT.md) for findings, verification and remaining production setup.

## Netlify hosting

Production: [dino404.xyz](https://dino404.xyz/). Preview: [preview--dino404.netlify.app](https://preview--dino404.netlify.app/). Production uses its own main database and custom-domain HTTPS. Deployment details and verification: [`docs/PRODUCTION-LAUNCH.md`](docs/PRODUCTION-LAUNCH.md).

Netlify runs the complete application with Next.js and managed Postgres. It includes server replay validation, persistent rankings and protected owner exports. See [`docs/NETLIFY.md`](docs/NETLIFY.md) for setup, deployment and owner access. The existing Sites/Cloudflare runtime remains available through the original commands below.

```powershell
npm ci
netlify dev
```

Netlify CLI starts the local Postgres emulator and applies `netlify/database/migrations`. Use the URL it prints. For integration checks without a Netlify login, run `npm run build:netlify`, `npm run test:netlify` and `npm run test:netlify:api`. The API suite creates a temporary database and starts its own production Next server.

## Run the Sites runtime locally

Requires Node.js 22.13+ and npm. From this directory:

```powershell
npm ci
npm run build
npm run db:migrate:local
npm run dev
```

Open the exact local URL printed by the server, normally `http://localhost:5173/`. D1 data persists in `.wrangler/state`. On the delivered working copy, dependencies and the first local migration have already been installed/applied.

The migration helper remembers locally applied migrations in `.sites-runtime/local-migrations.json`. Keep that marker with the matching local database. If restoring another database, restore its corresponding migration state rather than rerunning old migrations blindly.

Fresh hosted databases initialize the six initial tables and their indexes on the first API request. This uses the checked-in initial migration with additive `IF NOT EXISTS` statements, in one D1 batch, cached per Worker isolate. The packaged initial migration also uses `IF NOT EXISTS`, so the hosting migration runner can safely apply it to a database already initialized at runtime. Existing rows are preserved. This bootstrap is for schema version 1 only; future schema changes require explicit reviewed migrations.

Stop a built preview before rebuilding on Windows because it may hold output directories open. Stop a running server with Ctrl+C in its terminal. For a built Worker preview:

```powershell
npm run start
```

The built preview has no mock ChatGPT sign-in. The development server provides a loopback-only sign-in for the local owner panel at `/admin`. Its identity is `seedy@sites.test`; this development bypass is absent from production builds.

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run test:experience
# Requires the development preview to be running:
npm run test:api
npm run test:admin
```

`test:api` uses a clearly named local test runner. `test:admin` inserts a dedicated historical QA fixture, checks finalization, CSV, review and revisions, then removes only that fixture. Neither script permits a production origin. The sample CSV in `.sites-runtime/verified-sample.csv` is synthetic test data, not a reward instruction.

## Daily rules

- One wallet occupies one position per UTC day.
- Only a strictly higher accepted score replaces the record. Equal/lower scores preserve the prior record, name and achievement time.
- Ranking: score descending, verified achievement time ascending, stable run ID last.
- All new runs receive the same daily obstacle seed and physics version. Reward days pin that version until UTC rollover. A pre-season upgrade can advance the current day without deleting practice scores; already-issued tickets retain their original version.
- A run ends on collision, focus loss, a 30-minute limit, or the UTC cutoff.
- Runs must submit within 60 seconds of their ending. No simulated activity after midnight is accepted for the old day.
- Finalization happens after 00:01 UTC when competition/leaderboard/results are accessed. It is idempotent and does not depend on a browser being open at midnight. Historical days finalize when requested.
- Input logs are cleared by maintenance on subsequent requests once older than 30 days. Results and audit history remain.

## Owner workflow

1. On Netlify, open `/owner-login` with username `dino404found` and the privately configured owner password. On Sites, visit `/admin` and sign in with the permitted ChatGPT account.
2. Select the UTC competition date and load results.
3. Review the leading runs. The panel includes duration, jump count, duck holds, timestamp and end reason. Classic input logs remain readable.
4. If a run demonstrably violates the published rules, enter a reason and exclude it. One transaction restores that wallet's next valid best run, recalculates winners, and stores an audit entry. Finalized days receive a new result revision. Concurrent requests and retries do not duplicate the review or revision.
5. Download the final top-3 CSV and distribute rewards manually.
6. Always use the latest revision. Previously exported CSVs are not silently altered.

No transfers, token operations, wallet signing, or custody are implemented. The application never requests a private key or seed phrase.

## Runtime configuration

Copy `.env.example` or `.dev.vars.example` only if local overrides are needed. On hosted Sites, use runtime environment variables, not the source manifest. Configuration changes need a new deployment to take effect.

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | Exact email allowed after platform ChatGPT sign-in; keep as a secret runtime value |
| `ADMIN_PASSWORD_SHA256` | Netlify only: SHA-256 of a randomly generated owner password, at least 32 characters; missing configuration denies owner access |
| `APP_ORIGIN` | Netlify only: trusted public origin, including scheme, for a stable preview alias behind the Next proxy |
| `REWARDS_ENABLED` | `true` only when the operator is ready to open rewards |
| `REWARD_CONTRACT` | Verified, nonzero GOOGLc contract on Robinhood Chain |
| `REWARD_FIRST` | Positive decimal amount for rank 1 |
| `REWARD_SECOND` | Positive decimal amount for rank 2 |
| `REWARD_THIRD` | Positive decimal amount for rank 3 |
| `REWARD_SCHEDULE` | Clear human-readable manual distribution schedule |

The UI stays in pre-season when required reward settings are missing. Do not activate halfway through a day without announcing fair eligibility rules; prefer a fresh UTC day. The app displays one configured reward schedule and does not manage financial balances.

The owner email has been configured privately for the registered Site using its existing owner identity. Never expose this configuration or authentication headers to public clients.

## Architecture

| Path | Responsibility |
|---|---|
| `app/dino-app.tsx` | Public flow, identity form, countdown, results and leaderboard |
| `app/game-canvas.tsx` | Fixed-step run controller, input capture and interruption handling |
| `lib/game.ts` | Shared deterministic physics and replay |
| `lib/game-v1.ts` | Frozen classic simulation for already-issued 1.0.0 tickets |
| `lib/game-v2.ts` | Frozen jump/duck simulation for already-issued 2.0.0 tickets |
| `lib/render-signal.ts` | Optional gate graphics and reactive relay scenery |
| `lib/render-game.ts` | Canvas rendering and runtime sprite palette |
| `lib/scenery.ts` | Visual day/night cycle, zone palettes and readable scene ink |
| `lib/protocol.ts` | Identity, UTC rules, run validation and CSV escaping |
| `lib/server.ts` | Database access, sessions, limits, finalization, owner authorization |
| `lib/queries.ts` | Transactional ranking/finalization SQL used by production and tests |
| `lib/review.ts` | Atomic, idempotent owner exclusion and result revision |
| `lib/standings.ts` | Wallet/day record scoping and stale-response checks |
| `app/api/` | Public and protected server endpoints |
| `app/admin/` | Private review and CSV interface |
| `db/schema.ts`, `drizzle/` | Schema and generated migrations |

Stack: React/TypeScript. Netlify uses Next.js and managed Postgres; Sites uses Vinext/Vite, a Cloudflare-compatible Worker and D1 SQLite. Vite selects `lib/runtime-cloudflare.ts`; Next selects `lib/runtime.ts`. Data is not stored only in browser storage. Local storage is limited to identity convenience and a pending retry log. The two hosts have separate databases; no historical player data is copied automatically.

## Hosting and release

`.openai/hosting.json` preserves the registered Site ID and the logical `DB` binding. The build includes a Worker entry at `dist/server/index.js`, public assets at `dist/client`, and hosting/migration metadata at `dist/.openai`.

Sites uses dispatch authentication and its permitted owner email. Netlify uses a separately configured owner password and rejects client-supplied `oai-authenticated-user-*` headers. Never configure another host to trust those headers without a verified gateway.

Reward days keep their original simulation version until the next UTC day. Version 3.0 retains the 1.0 and 2.0 validators for pending runs and old-day tickets. While rewards are disabled, new tickets switch to 3.0 immediately; existing scores, seed and original run versions are preserved. Do not activate rewards partway through this pre-season transition day.

The project registration does not mean that `dino404.xyz` is connected. Domain ownership/DNS, the exact reward contract, reward amounts, distribution schedule, and token pair are separate launch tasks for the owner.

## Limits

Server replay rejects physically invalid runs and fabricated numeric scores. It does not prove human play or wallet ownership. Multiple wallets can belong to one person. Top results require operator review before payouts, especially if rewards become material.

This implementation has automated tests and browser checks; that is not a guarantee of zero bugs. It has not been load-tested for a large public launch or physically tested on a real phone during this session. Review `IMPLEMENTATION.md` for measured results and remaining launch prerequisites.

The landscape fades into forest night from 1,000 to 1,100 total points (including bonuses) and back to daylight from 2,000 to 2,100, repeating every 1,000 points. Clouds, mountain layers and trees move at different speeds; reduced motion freezes decorative movement. Scene colors and relay lights do not alter collisions.

The dinosaur's frames are isolated before scaling to prevent neighboring sprite pixels from bleeding into the image. The header and browser icons use the same idle silhouette. The waiting mascot blinks briefly; this pauses in hidden tabs and when reduced motion is enabled.

See [`docs/SIGNAL-GATE.md`](docs/SIGNAL-GATE.md) for the current identity update, verification and a short try-it guide.

See [`docs/DEBUG-AUDIT-MOTION.md`](docs/DEBUG-AUDIT-MOTION.md) for the latest local audit: correct validation focus, bounded UTC retries, visible connection recovery, and accurate status when a submission reply is lost. 45 core, 13 API, and 7 admin checks passed. These fixes have not been deployed.

See [`docs/DEBUG-AUDIT-V3.md`](docs/DEBUG-AUDIT-V3.md) for the preceding gameplay audit: drone hints keep priority over bonus feedback, scene labels retain normal-text contrast, and submission/finalization use the same exclusive UTC cutoff.

See [`docs/MOTION-IDENTITY.md`](docs/MOTION-IDENTITY.md) for the Run to reconnect UI update: relay indicators, mobile mascot, entry/result transitions, animated scores and server-confirmed verification states.

See [`docs/SPRITE-POLISH.md`](docs/SPRITE-POLISH.md) for sprite/icon cleanup, [`docs/MAP-POLISH.md`](docs/MAP-POLISH.md) for landscape changes, and [`docs/DEBUG-AUDIT.md`](docs/DEBUG-AUDIT.md) for the preceding bug audit. See [`ASSETS.md`](ASSETS.md) for primary sources and shipped license notices.
