# DINO404

Classic pixel runner, green candlestick obstacles, a daily UTC leaderboard, server replay validation, and private top-3 CSV exports. The product specification is in [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md), copied from the workspace masterplan. Implementation decisions and verification are recorded in [`IMPLEMENTATION.md`](IMPLEMENTATION.md).

## Run locally

Requires Node.js 22.13+ and npm. From this directory:

```powershell
npm ci
npm run build
npm run db:migrate:local
npm run dev
```

Open the exact local URL printed by the server, normally `http://localhost:5173/`. D1 data persists in `.wrangler/state`. On the delivered working copy, dependencies and the first local migration have already been installed/applied.

The migration helper remembers locally applied migrations in `.sites-runtime/local-migrations.json`. Keep that marker with the matching local database. If restoring another database, restore its corresponding migration state rather than rerunning old migrations blindly.

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
# Requires the development preview to be running:
npm run test:api
npm run test:admin
```

`test:api` uses a clearly named local test runner. `test:admin` inserts a dedicated historical QA fixture, checks finalization, CSV, review and revisions, then removes only that fixture. Neither script permits a production origin. The sample CSV in `.sites-runtime/verified-sample.csv` is synthetic test data, not a reward instruction.

## Daily rules

- One wallet occupies one position per UTC day.
- Only a strictly higher accepted score replaces the record. Equal/lower scores preserve the prior record, name and achievement time.
- Ranking: score descending, verified achievement time ascending, stable run ID last.
- All players receive the same daily obstacle seed and physics version.
- A run ends on collision, focus loss, a 30-minute limit, or the UTC cutoff.
- Runs must submit within 60 seconds of their ending. No simulated activity after midnight is accepted for the old day.
- Finalization happens after 00:01 UTC when competition/leaderboard/results are accessed. It is idempotent and does not depend on a browser being open at midnight. Historical days finalize when requested.
- Input logs are cleared by maintenance on subsequent requests once older than 30 days. Results and audit history remain.

## Owner workflow

1. Visit `/admin` and sign in with the permitted owner account.
2. Select the UTC competition date and load results.
3. Review the leading runs. The panel includes duration, jump count, timestamp and end reason.
4. If a run demonstrably violates the published rules, enter a reason and exclude it. The system restores that wallet's next valid best run, recalculates winners, and stores an audit entry. Finalized days receive a new result revision.
5. Download the final top-3 CSV and distribute rewards manually.
6. Always use the latest revision. Previously exported CSVs are not silently altered.

No transfers, token operations, wallet signing, or custody are implemented. The application never requests a private key or seed phrase.

## Runtime configuration

Copy `.env.example` or `.dev.vars.example` only if local overrides are needed. On hosted Sites, use runtime environment variables, not the source manifest. Configuration changes need a new deployment to take effect.

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | Exact email allowed after platform ChatGPT sign-in; keep as a secret runtime value |
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
| `lib/render-game.ts` | Canvas rendering and runtime sprite palette |
| `lib/protocol.ts` | Identity, UTC rules, run validation and CSV escaping |
| `lib/server.ts` | Database access, sessions, limits, finalization, owner authorization |
| `lib/queries.ts` | Transactional ranking/finalization SQL used by production and tests |
| `app/api/` | Public and protected server endpoints |
| `app/admin/` | Private review and CSV interface |
| `db/schema.ts`, `drizzle/` | Schema and generated migrations |

Stack: React/TypeScript, Vinext/Vite, Cloudflare Worker-compatible server, D1 SQLite persistence. Data is not stored only in browser storage. Local storage is limited to identity convenience and a pending retry log.

## Hosting and release

`.openai/hosting.json` preserves the registered Site ID and the logical `DB` binding. The build includes a Worker entry at `dist/server/index.js`, public assets at `dist/client`, and hosting/migration metadata at `dist/.openai`.

The source is prepared for Sites dispatch authentication. Deploying directly to a different host requires an equivalent trusted identity gateway. Do not trust arbitrary client-supplied `oai-authenticated-user-*` headers on an unprotected origin. The private owner panel intentionally denies access without the trusted platform identity and permitted email.

Do not change `GAME.version` or physics mid-competition. A production change to physics should be scheduled for the next UTC day, or versioned validators should be retained for pending runs. No such public competition existed during initial development.

The project registration does not mean that `dino404.xyz` is connected. Domain ownership/DNS, the exact reward contract, reward amounts, distribution schedule, and token pair are separate launch tasks for the owner.

## Limits

Server replay rejects physically invalid runs and fabricated numeric scores. It does not prove human play or wallet ownership. Multiple wallets can belong to one person. Top results require operator review before payouts, especially if rewards become material.

This implementation has automated tests and browser checks; that is not a guarantee of zero bugs. It has not been load-tested for a large public launch or physically tested on a real phone during this session. Review `IMPLEMENTATION.md` for measured results and remaining launch prerequisites.

See [`ASSETS.md`](ASSETS.md) for primary sources and shipped license notices.
