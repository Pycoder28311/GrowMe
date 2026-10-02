CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `images_key_unique` ON `images` (`key`);--> statement-breakpoint
CREATE TABLE `note_images` (
	`note_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`note_id`, `image_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
