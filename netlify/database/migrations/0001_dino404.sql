CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"at" bigint NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"reason" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "daily_best" (
	"day" text NOT NULL,
	"wallet" text NOT NULL,
	"name" text NOT NULL,
	"score" bigint NOT NULL,
	"achieved_at" bigint NOT NULL,
	"run_id" text NOT NULL,
	PRIMARY KEY("day", "wallet")
);

CREATE INDEX IF NOT EXISTS "idx_best_rank" ON "daily_best" ("day","score","achieved_at","run_id");
CREATE TABLE IF NOT EXISTS "competition_days" (
	"day" text PRIMARY KEY NOT NULL,
	"seed" bigint NOT NULL,
	"version" text NOT NULL,
	"closes_at" bigint NOT NULL,
	"finalized_at" bigint,
	"revision" bigint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" bigint NOT NULL,
	"expires_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"day" text NOT NULL,
	"session" text NOT NULL,
	"wallet" text NOT NULL,
	"name" text NOT NULL,
	"seed" bigint NOT NULL,
	"version" text NOT NULL,
	"start_at" bigint NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"score" bigint,
	"achieved_at" bigint,
	"submitted_at" bigint,
	"input_log" text,
	"ticks" bigint,
	"reason" text
);

CREATE INDEX IF NOT EXISTS "idx_runs_day_status_score" ON "runs" ("day","status","score");
CREATE INDEX IF NOT EXISTS "idx_runs_session_status" ON "runs" ("session","status");
CREATE TABLE IF NOT EXISTS "daily_results" (
	"day" text NOT NULL,
	"revision" bigint NOT NULL,
	"rank" bigint NOT NULL,
	"wallet" text NOT NULL,
	"name" text NOT NULL,
	"score" bigint NOT NULL,
	"achieved_at" bigint NOT NULL,
	"run_id" text NOT NULL,
	PRIMARY KEY("day", "revision", "rank")
);

