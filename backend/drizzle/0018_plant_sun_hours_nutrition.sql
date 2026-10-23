ALTER TABLE `plants` ADD `nutrition` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `cook_tip` text;--> statement-breakpoint
ALTER TABLE `plants` ADD `sun_hours` integer;--> statement-breakpoint
-- A first value for the plants that already have a sun bar: its length in hours (the intense bar, else the soft one)
UPDATE `plants` SET `sun_hours` = COALESCE(
  CASE WHEN `sun_intense_start` IS NOT NULL AND `sun_intense_end` IS NOT NULL THEN `sun_intense_end` - `sun_intense_start` END,
  CASE WHEN `sun_soft_start` IS NOT NULL AND `sun_soft_end` IS NOT NULL THEN `sun_soft_end` - `sun_soft_start` END
);
