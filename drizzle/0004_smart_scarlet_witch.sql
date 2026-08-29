CREATE TABLE `site_code_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`custom_css` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
