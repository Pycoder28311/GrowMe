CREATE TABLE `user_locations` (
	`user_id` text PRIMARY KEY NOT NULL,
	`area` text,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
