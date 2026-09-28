CREATE TABLE IF NOT EXISTS `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`at` integer NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_best` (
	`day` text NOT NULL,
	`wallet` text NOT NULL,
	`name` text NOT NULL,
	`score` integer NOT NULL,
	`achieved_at` integer NOT NULL,
	`run_id` text NOT NULL,
	PRIMARY KEY(`day`, `wallet`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_best_rank` ON `daily_best` (`day`,`score`,`achieved_at`,`run_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `competition_days` (
	`day` text PRIMARY KEY NOT NULL,
	`seed` integer NOT NULL,
	`version` text NOT NULL,
	`closes_at` integer NOT NULL,
	`finalized_at` integer,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`session` text NOT NULL,
	`wallet` text NOT NULL,
	`name` text NOT NULL,
	`seed` integer NOT NULL,
	`version` text NOT NULL,
	`start_at` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`score` integer,
	`achieved_at` integer,
	`submitted_at` integer,
	`input_log` text,
	`ticks` integer,
	`reason` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_runs_day_status_score` ON `runs` (`day`,`status`,`score`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_runs_session_status` ON `runs` (`session`,`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_results` (
	`day` text NOT NULL,
	`revision` integer NOT NULL,
	`rank` integer NOT NULL,
	`wallet` text NOT NULL,
	`name` text NOT NULL,
	`score` integer NOT NULL,
	`achieved_at` integer NOT NULL,
	`run_id` text NOT NULL,
	PRIMARY KEY(`day`, `revision`, `rank`)
);

