CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`destination_url` text,
	`state` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "entries_kind_check" CHECK("entries"."kind" IN ('note', 'article', 'link', 'announcement')),
	CONSTRAINT "entries_state_check" CHECK("entries"."state" IN ('draft', 'published'))
);
--> statement-breakpoint
CREATE INDEX `idx_entries_public_order` ON `entries` (`state`,`published_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_entries_updated_at` ON `entries` (`updated_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`account_type` text NOT NULL,
	`short_description` text NOT NULL,
	`introduction` text NOT NULL,
	`location` text,
	`website` text,
	`external_links_json` text DEFAULT '[]' NOT NULL,
	`canonical_url` text NOT NULL,
	`accent_color` text DEFAULT '#31554d' NOT NULL,
	`density` text DEFAULT 'comfortable' NOT NULL,
	`hide_powered_by` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "profiles_singleton_check" CHECK("profiles"."id" = 1),
	CONSTRAINT "profiles_density_check" CHECK("profiles"."density" IN ('comfortable', 'compact'))
);
