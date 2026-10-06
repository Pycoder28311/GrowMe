-- Lifecycles get an order (like tips); existing rows keep today's order (by id)
DROP INDEX `lifecycles_plant_id_idx`;--> statement-breakpoint
ALTER TABLE `lifecycles` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `lifecycles_plant_id_idx` ON `lifecycles` (`plant_id`,`position`);--> statement-breakpoint
UPDATE `lifecycles` SET `position` = `id`;--> statement-breakpoint
-- images.user_id becomes nullable (null = uploaded by the admin). SQLite needs a table rebuild, and on D1
-- (foreign keys always on) dropping `images` cascades to the link tables, so they are copied first and
-- restored after. Edited by hand: drizzle-kit's version loses every image link.
CREATE TABLE `__bk_note_images` AS SELECT * FROM `note_images`;--> statement-breakpoint
CREATE TABLE `__bk_post_images` AS SELECT * FROM `post_images`;--> statement-breakpoint
CREATE TABLE `__bk_blog_images` AS SELECT * FROM `blog_images`;--> statement-breakpoint
CREATE TABLE `__bk_plant_images` AS SELECT * FROM `plant_images`;--> statement-breakpoint
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "user_id", "key", "content_type", "size", "created_at") SELECT "id", "user_id", "key", "content_type", "size", "created_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
CREATE UNIQUE INDEX `images_key_unique` ON `images` (`key`);--> statement-breakpoint
INSERT INTO `note_images` SELECT * FROM `__bk_note_images` WHERE true ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO `post_images` SELECT * FROM `__bk_post_images` WHERE true ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO `blog_images` SELECT * FROM `__bk_blog_images` WHERE true ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO `plant_images` SELECT * FROM `__bk_plant_images` WHERE true ON CONFLICT DO NOTHING;--> statement-breakpoint
DROP TABLE `__bk_note_images`;--> statement-breakpoint
DROP TABLE `__bk_post_images`;--> statement-breakpoint
DROP TABLE `__bk_blog_images`;--> statement-breakpoint
DROP TABLE `__bk_plant_images`;
