CREATE TABLE `blog_content_images` (
	`blog_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	PRIMARY KEY(`blog_id`, `image_id`),
	FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
