CREATE TABLE `admin_login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_hash` text NOT NULL,
	`succeeded` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_login_attempts_client_time_idx` ON `admin_login_attempts` (`client_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `admin_login_attempts_success_time_idx` ON `admin_login_attempts` (`succeeded`,`created_at`);