CREATE TABLE `admin_action_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_action_attempts_actor_time_idx` ON `admin_action_attempts` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`page_path` text NOT NULL,
	`node_key` text NOT NULL,
	`previous_value_hash` text,
	`next_value_hash` text,
	`client_hash` text,
	`request_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_audit_log_created_at_idx` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_log_actor_time_idx` ON `admin_audit_log` (`actor_user_id`,`created_at`);