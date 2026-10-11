-- Written by hand: drizzle-kit leaves out ON DELETE here. Adding the column (instead of rebuilding the
-- table) keeps every post's replies and photo links, which a rebuild would cascade-delete.
ALTER TABLE `posts` ADD `plant_id` integer REFERENCES plants(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `posts_plant_id_idx` ON `posts` (`plant_id`);
