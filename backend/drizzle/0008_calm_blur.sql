-- Reddit-like replies: a reply can answer another reply. Answers are deleted with the reply they answer.
-- Edited by hand: drizzle-kit leaves out ON DELETE CASCADE on an added column.
ALTER TABLE `post_replies` ADD `parent_reply_id` integer REFERENCES post_replies(id) ON DELETE cascade;--> statement-breakpoint
CREATE INDEX `post_replies_parent_idx` ON `post_replies` (`parent_reply_id`);
