CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`page_path` text NOT NULL,
	`session_id` text NOT NULL,
	`label` text,
	`target` text,
	`referrer` text,
	`device` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_time_idx` ON `analytics_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_page_time_idx` ON `analytics_events` (`page_path`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_session_time_idx` ON `analytics_events` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_path` text NOT NULL,
	`node_key` text NOT NULL,
	`value` text NOT NULL,
	`original_value` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_content_page_node_idx` ON `site_content` (`page_path`,`node_key`);--> statement-breakpoint
CREATE INDEX `site_content_updated_at_idx` ON `site_content` (`updated_at`);