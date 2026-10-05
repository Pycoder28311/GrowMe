CREATE TABLE `blog_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blog_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`parent_comment_id` integer,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `blog_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blog_comments_blog_id_idx` ON `blog_comments` (`blog_id`);--> statement-breakpoint
CREATE INDEX `blog_comments_parent_idx` ON `blog_comments` (`parent_comment_id`);--> statement-breakpoint
CREATE TABLE `blog_images` (
	`blog_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`blog_id`, `image_id`),
	FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `blogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `combinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `diseases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`title` text NOT NULL,
	`label` text,
	`content` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diseases_plant_id_idx` ON `diseases` (`plant_id`);--> statement-breakpoint
CREATE TABLE `lifecycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lifecycles_plant_id_idx` ON `lifecycles` (`plant_id`);--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`liked_type` text NOT NULL,
	`liked_id` integer NOT NULL,
	`is_like` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "likes_liked_type_check" CHECK("likes"."liked_type" IN ('post', 'post_reply', 'blog', 'blog_comment'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `likes_target_user_idx` ON `likes` (`liked_type`,`liked_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `likes_user_id_idx` ON `likes` (`user_id`);--> statement-breakpoint
CREATE TABLE `plant_images` (
	`plant_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`plant_id`, `image_id`),
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`combination_id` integer,
	`name` text NOT NULL,
	`scientific_name` text NOT NULL,
	`description` text,
	`price_min` integer,
	`price_max` integer,
	`seeds` integer DEFAULT false NOT NULL,
	`native` integer DEFAULT false NOT NULL,
	`food` integer DEFAULT false NOT NULL,
	`difficulty` integer NOT NULL,
	`sunlight_hours_min` integer,
	`sunlight_hours_max` integer,
	`month_start` integer,
	`month_end` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`combination_id`) REFERENCES `combinations`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "plants_difficulty_check" CHECK("plants"."difficulty" BETWEEN 1 AND 5),
	CONSTRAINT "plants_month_check" CHECK("plants"."month_start" BETWEEN 1 AND 12 AND "plants"."month_end" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE INDEX `plants_combination_id_idx` ON `plants` (`combination_id`);--> statement-breakpoint
CREATE TABLE `post_images` (
	`post_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`post_id`, `image_id`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_replies_post_id_idx` ON `post_replies` (`post_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_user_id_idx` ON `posts` (`user_id`);--> statement-breakpoint
CREATE TABLE `tips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tips_plant_id_idx` ON `tips` (`plant_id`,`position`);