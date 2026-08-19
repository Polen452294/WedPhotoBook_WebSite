CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`message` text,
	`source_path` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notification_status` text DEFAULT 'pending' NOT NULL,
	`notification_error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `enquiries_created_at_idx` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`);--> statement-breakpoint
CREATE TABLE `submission_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submission_attempts_client_time_idx` ON `submission_attempts` (`client_hash`,`created_at`);