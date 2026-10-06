-- Tips become a library: a tip loses plant_id/position, and plant_tips links tips to plants in order.
-- Edited by hand: drizzle-kit's version drops every tip's plant. The links are saved first (numbered
-- per plant in today's order: position, then id), `tips` is rebuilt while nothing references it, then
-- plant_tips is created and filled from the saved links.
CREATE TABLE `__bk_plant_tips` AS
  SELECT `plant_id`, `id` AS `tip_id`, ROW_NUMBER() OVER (PARTITION BY `plant_id` ORDER BY `position`, `id`) - 1 AS `position`
  FROM `tips`;--> statement-breakpoint
CREATE TABLE `__new_tips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tips`("id", "title", "content") SELECT "id", "title", "content" FROM `tips`;--> statement-breakpoint
DROP TABLE `tips`;--> statement-breakpoint
ALTER TABLE `__new_tips` RENAME TO `tips`;--> statement-breakpoint
CREATE TABLE `plant_tips` (
	`plant_id` integer NOT NULL,
	`tip_id` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`plant_id`, `tip_id`),
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tip_id`) REFERENCES `tips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plant_tips_plant_idx` ON `plant_tips` (`plant_id`,`position`);--> statement-breakpoint
CREATE INDEX `plant_tips_tip_idx` ON `plant_tips` (`tip_id`);--> statement-breakpoint
INSERT INTO `plant_tips` (`plant_id`, `tip_id`, `position`) SELECT `plant_id`, `tip_id`, `position` FROM `__bk_plant_tips`;--> statement-breakpoint
DROP TABLE `__bk_plant_tips`;
