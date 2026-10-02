ALTER TABLE `images` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `notes` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
CREATE INDEX `notes_user_id_idx` ON `notes` (`user_id`);