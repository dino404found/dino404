import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const days = sqliteTable("competition_days", {
  day: text("day").primaryKey(),
  seed: integer("seed").notNull(),
  version: text("version").notNull(),
  closesAt: integer("closes_at").notNull(),
  finalizedAt: integer("finalized_at"),
  revision: integer("revision").notNull().default(0),
});
export const runs = sqliteTable(
  "runs",
  {
    id: text("id").primaryKey(),
    day: text("day").notNull(),
    session: text("session").notNull(),
    wallet: text("wallet").notNull(),
    name: text("name").notNull(),
    seed: integer("seed").notNull(),
    version: text("version").notNull(),
    startAt: integer("start_at").notNull(),
    status: text("status").notNull().default("active"),
    score: integer("score"),
    achievedAt: integer("achieved_at"),
    submittedAt: integer("submitted_at"),
    inputLog: text("input_log"),
    ticks: integer("ticks"),
    reason: text("reason"),
  },
  (t) => [
    index("idx_runs_day_status_score").on(t.day, t.status, t.score),
    index("idx_runs_session_status").on(t.session, t.status),
  ],
);
export const best = sqliteTable(
  "daily_best",
  {
    day: text("day").notNull(),
    wallet: text("wallet").notNull(),
    name: text("name").notNull(),
    score: integer("score").notNull(),
    achievedAt: integer("achieved_at").notNull(),
    runId: text("run_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.day, t.wallet] }),
    index("idx_best_rank").on(t.day, t.score, t.achievedAt, t.runId),
  ],
);
export const winners = sqliteTable(
  "daily_results",
  {
    day: text("day").notNull(),
    revision: integer("revision").notNull(),
    rank: integer("rank").notNull(),
    wallet: text("wallet").notNull(),
    name: text("name").notNull(),
    score: integer("score").notNull(),
    achievedAt: integer("achieved_at").notNull(),
    runId: text("run_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.revision, t.rank] })],
);
export const audit = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  at: integer("at").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  reason: text("reason").notNull(),
});
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
