-- Plant fields v2 (plan 14): family, trivia and secret; two sun bars; seeding and planting seasons;
-- pot sizes, difficulty, time needed and toxicity as JSON lists; frost / salt / wind tolerance levels;
-- evergreen and greenness flags; a lifespan in years; lifecycle tabs; three disease texts. The price range,
-- kind, size, the old wind and lifespan text, and the tips library are dropped.
-- Edited by hand: drizzle-kit rebuilds `plants`, and on D1 (foreign keys always on) dropping it deletes
-- every lifecycle, disease and photo link. Here columns are only added, filled, renamed and dropped (no
-- index or CHECK uses a dropped one): no rebuild. `difficulty` stays: its CHECK blocks dropping it, and
-- the API writes it as the hardest of `difficulty_levels`. The month columns are renamed (SQLite rewrites
-- the `plants_month_check` CHECK with them). Back up the database before applying this.
-- new columns
ALTER TABLE `plants` ADD `family` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `trivia` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `secret` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `greenness` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `evergreen` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `frost_tolerance` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `salt_tolerance` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `wind_tolerance` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `pot_sizes` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `difficulty_levels` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `time_needed` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `toxicity` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `plants` ADD `sun_soft_start` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `sun_soft_end` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_start` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_end` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_start_2` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_end_2` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_start_3` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `seeding_end_3` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `lifespan_min` integer;--> statement-breakpoint
ALTER TABLE `plants` ADD `lifespan_max` integer;--> statement-breakpoint
-- difficulty 1 / 2 / 3–5 → small / medium / big
UPDATE `plants` SET `difficulty_levels` = CASE WHEN `difficulty` <= 1 THEN '["small"]' WHEN `difficulty` = 2 THEN '["medium"]' ELSE '["big"]' END;--> statement-breakpoint
-- the old lifespan text («4-6 years», «2 years», «6 weeks») → whole years, at least 1
UPDATE `plants` SET
  `lifespan_min` = max(1, CAST(round(CAST(CASE WHEN instr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), '-') > 0 THEN substr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), 1, instr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), '-') - 1) ELSE substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1) END AS REAL) * (CASE substr(`lifespan`, instr(`lifespan`, ' ') + 1) WHEN 'years' THEN 1.0 WHEN 'months' THEN 1 / 12.0 WHEN 'weeks' THEN 1 / 52.0 ELSE 1 / 365.0 END)) AS INTEGER)),
  `lifespan_max` = max(1, CAST(round(CAST(CASE WHEN instr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), '-') > 0 THEN substr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), instr(substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1), '-') + 1) ELSE substr(`lifespan`, 1, instr(`lifespan`, ' ') - 1) END AS REAL) * (CASE substr(`lifespan`, instr(`lifespan`, ' ') + 1) WHEN 'years' THEN 1.0 WHEN 'months' THEN 1 / 12.0 WHEN 'weeks' THEN 1 / 52.0 ELSE 1 / 365.0 END)) AS INTEGER))
WHERE `lifespan` IS NOT NULL AND instr(`lifespan`, ' ') > 0;--> statement-breakpoint
-- tolerance: wind strong / moderate / light / sheltered → big / medium / small / small; frost hardy and near the sea → big
UPDATE `plants` SET
  `wind_tolerance` = CASE `wind` WHEN 'strong' THEN 'big' WHEN 'moderate' THEN 'medium' WHEN 'light' THEN 'small' WHEN 'sheltered' THEN 'small' ELSE NULL END,
  `frost_tolerance` = CASE WHEN `frost_hardy` = 1 THEN 'big' ELSE NULL END,
  `salt_tolerance` = CASE WHEN `near_sea` = 1 THEN 'big' ELSE NULL END;--> statement-breakpoint
-- the sun window becomes the intense bar, kept inside 6–21
ALTER TABLE `plants` RENAME COLUMN `sun_start` TO `sun_intense_start`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `sun_end` TO `sun_intense_end`;--> statement-breakpoint
UPDATE `plants` SET
  `sun_intense_start` = CASE WHEN `sun_intense_start` IS NULL OR `sun_intense_end` IS NULL OR max(6, `sun_intense_start`) >= min(21, `sun_intense_end`) THEN NULL ELSE max(6, `sun_intense_start`) END,
  `sun_intense_end` = CASE WHEN `sun_intense_start` IS NULL OR `sun_intense_end` IS NULL OR max(6, `sun_intense_start`) >= min(21, `sun_intense_end`) THEN NULL ELSE min(21, `sun_intense_end`) END;--> statement-breakpoint
-- the month ranges are the planting season
ALTER TABLE `plants` RENAME COLUMN `month_start` TO `planting_start`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `month_end` TO `planting_end`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `month_start_2` TO `planting_start_2`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `month_end_2` TO `planting_end_2`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `month_start_3` TO `planting_start_3`;--> statement-breakpoint
ALTER TABLE `plants` RENAME COLUMN `month_end_3` TO `planting_end_3`;--> statement-breakpoint
-- removed fields
ALTER TABLE `plants` DROP COLUMN `price_min`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `price_max`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `kind`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `size`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `lifespan`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `wind`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `frost_hardy`;--> statement-breakpoint
ALTER TABLE `plants` DROP COLUMN `near_sea`;--> statement-breakpoint
-- lifecycle stages: the seed flag becomes a tab (seed / plant / care)
ALTER TABLE `lifecycles` ADD `tab` text DEFAULT 'plant' NOT NULL;--> statement-breakpoint
UPDATE `lifecycles` SET `tab` = 'seed' WHERE `seed` = 1;--> statement-breakpoint
ALTER TABLE `lifecycles` DROP COLUMN `seed`;--> statement-breakpoint
-- diseases: three texts instead of one (the old text becomes «Τι είναι»)
ALTER TABLE `diseases` ADD `symptoms` text;--> statement-breakpoint
ALTER TABLE `diseases` ADD `what` text;--> statement-breakpoint
ALTER TABLE `diseases` ADD `action` text;--> statement-breakpoint
UPDATE `diseases` SET `what` = `content`;--> statement-breakpoint
ALTER TABLE `diseases` DROP COLUMN `content`;--> statement-breakpoint
-- the tips library
DROP TABLE `plant_tips`;--> statement-breakpoint
DROP TABLE `tips`;
