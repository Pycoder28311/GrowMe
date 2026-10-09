-- Plant fields (plan 07): yes/no flags, wind / kind / size, 3 difficulty levels, a sun window in clock
-- hours, up to 3 month ranges, a lifespan, and seed stages with a duration.
-- Edited by hand: drizzle-kit rebuilds `plants`, and on D1 (foreign keys always on) dropping it deletes
-- every lifecycle, tip link, disease and photo link. Here columns are only added, filled, dropped (nothing
-- indexes or checks them) and renamed: no rebuild. The difficulty CHECK still says 1–5; the API allows 1–3.
-- food: text → yes/no (any text except «Μη φαγώσιμο» / «Τοξικό» means edible)
ALTER TABLE `plants` ADD `food_b` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `plants` SET `food_b` = CASE WHEN `food` IS NOT NULL AND trim(`food`) <> '' AND trim(`food`) NOT IN ('Μη φαγώσιμο', 'Τοξικό') THEN 1 ELSE 0 END;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `food`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `food_b` TO `food`;--> statement-breakpoint
-- seeds: replaced by seed stages
ALTER TABLE `plants` DROP COLUMN `seeds`;--> statement-breakpoint
ALTER TABLE `plants` ADD `aromatic` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `climbing` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `ornamental` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `succulent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `small_tree` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `privacy` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `near_sea` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `frost_hardy` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `wind` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `size` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `month_start_2` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `month_end_2` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `month_start_3` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `month_end_3` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `lifespan` text;--> statement-breakpoint
-- difficulty 1–5 → 1–3
UPDATE `plants` SET `difficulty` = CASE WHEN `difficulty` <= 2 THEN 1 WHEN `difficulty` = 3 THEN 2 ELSE 3 END;--> statement-breakpoint
-- sun: hours a day → a window centred on 13:00 from the smaller count (6–8 h → 10:00–16:00; 0 h → empty)
ALTER TABLE `plants` ADD `sun_h` integer;--> statement-breakpoint
UPDATE `plants` SET `sun_h` = coalesce(`sunlight_hours_min`, `sunlight_hours_max`);--> statement-breakpoint
UPDATE `plants` SET `sunlight_hours_min` = CASE WHEN `sun_h` IS NULL OR `sun_h` <= 0 THEN NULL ELSE max(0, min(13 - `sun_h` / 2, 24 - `sun_h`)) END;--> statement-breakpoint
UPDATE `plants` SET `sunlight_hours_max` = CASE WHEN `sunlight_hours_min` IS NULL THEN NULL ELSE `sunlight_hours_min` + `sun_h` END;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `sun_h`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `sunlight_hours_min` TO `sun_start`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `sunlight_hours_max` TO `sun_end`;--> statement-breakpoint
-- lifecycle stages: seed (before the plant is sold ready to transplant) and the time from sowing
ALTER TABLE `lifecycles` ADD `seed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `lifecycles` ADD `duration` text;
