-- food / native / seeds: yes/no become short texts (null = not shown), converted to what the app showed.
-- Edited by hand: drizzle-kit rebuilds `plants`, and on D1 (foreign keys always on) dropping it deletes
-- every lifecycle, tip link, disease and photo link. Here each column is added as text, filled, the old
-- one dropped (nothing indexes or checks it) and the new one renamed: no rebuild.
ALTER TABLE `plants` ADD `food_t` text;--> statement-breakpoint
UPDATE `plants` SET `food_t` = CASE WHEN `food` THEN 'Φαγώσιμο' ELSE NULL END;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `food`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `food_t` TO `food`;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeds_t` text;--> statement-breakpoint
UPDATE `plants` SET `seeds_t` = CASE WHEN `seeds` THEN 'Από σπόρο' ELSE 'Από φυτό' END;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `seeds`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `seeds_t` TO `seeds`;--> statement-breakpoint
ALTER TABLE `plants` ADD `native_t` text;--> statement-breakpoint
UPDATE `plants` SET `native_t` = CASE WHEN `native` THEN 'Ιθαγενές της Ελλάδας' ELSE NULL END;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `native`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `native_t` TO `native`;
