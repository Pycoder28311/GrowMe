import { relations, sql } from 'drizzle-orm'
import { sqliteTable, integer, text, primaryKey, index, uniqueIndex, check, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'
export * from './auth-schema'

// Same columns in every table, written once
const id = () => integer('id').primaryKey({ autoIncrement: true })
const createdAt = () => integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
const owner = () => text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
const optionalOwner = () => text('user_id').references(() => user.id, { onDelete: 'cascade' })

/* ─────────────── Notes (existing) ─────────────── */

export const notes = sqliteTable(
    'notes',
    {
        id: id(),
        userId: owner(),
        text: text('text').notNull(),
    },
    (t) => [index('notes_user_id_idx').on(t.userId)],
)

/* ─────────────── Images (existing): files in R2, one row per file ─────────────── */

export const images = sqliteTable('images', {
    id: id(),
    userId: optionalOwner(), // null = uploaded by the admin (dashboard)
    key: text('key').notNull().unique(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    createdAt: createdAt(),
})

/* ─────────────── Posts ─────────────── */

export const posts = sqliteTable(
    'posts',
    {
        id: id(),
        userId: owner(),
        title: text('title').notNull(),
        content: text('content').notNull(),
        likeCount: integer('like_count').notNull().default(0),
        replyCount: integer('reply_count').notNull().default(0),
        createdAt: createdAt(),
    },
    (t) => [index('posts_user_id_idx').on(t.userId)],
)

export const postReplies = sqliteTable(
    'post_replies',
    {
        id: id(),
        postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
        userId: owner(),
        // null = answers the post itself; otherwise the reply it answers (Reddit-like nesting)
        parentReplyId: integer('parent_reply_id').references((): AnySQLiteColumn => postReplies.id, {
            onDelete: 'cascade',
        }),
        content: text('content').notNull(),
        likeCount: integer('like_count').notNull().default(0),
        createdAt: createdAt(),
    },
    (t) => [index('post_replies_post_id_idx').on(t.postId), index('post_replies_parent_idx').on(t.parentReplyId)],
)

/* ─────────────── Blogs ─────────────── */

export const blogs = sqliteTable('blogs', {
    id: id(),
    name: text('name').notNull(),
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    createdAt: createdAt(),
})

export const blogComments = sqliteTable(
    'blog_comments',
    {
        id: id(),
        blogId: integer('blog_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
        userId: owner(),
        // null = top-level comment; otherwise the comment it answers
        parentCommentId: integer('parent_comment_id').references((): AnySQLiteColumn => blogComments.id, {
            onDelete: 'cascade',
        }),
        content: text('content').notNull(),
        likeCount: integer('like_count').notNull().default(0),
        createdAt: createdAt(),
    },
    (t) => [index('blog_comments_blog_id_idx').on(t.blogId), index('blog_comments_parent_idx').on(t.parentCommentId)],
)

/* ─────────────── Likes: one table for everything that can be liked ─────────────── */

export const LIKED_TYPES = ['post', 'post_reply', 'blog', 'blog_comment'] as const

export const likes = sqliteTable(
    'likes',
    {
        id: id(),
        userId: owner(),
        likedType: text('liked_type', { enum: LIKED_TYPES }).notNull(),
        likedId: integer('liked_id').notNull(),
        isLike: integer('is_like', { mode: 'boolean' }).notNull().default(true), // false = dislike
        createdAt: createdAt(),
    },
    (t) => [
        uniqueIndex('likes_target_user_idx').on(t.likedType, t.likedId, t.userId), // one like per user per item
        index('likes_user_id_idx').on(t.userId),
        check('likes_liked_type_check', sql`${t.likedType} IN ('post', 'post_reply', 'blog', 'blog_comment')`),
    ],
)

/* ─────────────── Plants ─────────────── */

export const combinations = sqliteTable('combinations', {
    id: id(),
    title: text('title').notNull(),
    description: text('description'),
})

export const plants = sqliteTable(
    'plants',
    {
        id: id(),
        combinationId: integer('combination_id').references(() => combinations.id, { onDelete: 'set null' }),
        name: text('name').notNull(),
        scientificName: text('scientific_name').notNull(),
        description: text('description'),
        priceMin: integer('price_min'), // in cents
        priceMax: integer('price_max'),
        seeds: integer('seeds', { mode: 'boolean' }).notNull().default(false),
        native: integer('native', { mode: 'boolean' }).notNull().default(false),
        food: integer('food', { mode: 'boolean' }).notNull().default(false),
        difficulty: integer('difficulty').notNull(), // 1 (easy) – 5 (hard)
        sunlightHoursMin: integer('sunlight_hours_min'),
        sunlightHoursMax: integer('sunlight_hours_max'),
        monthStart: integer('month_start'), // 1–12
        monthEnd: integer('month_end'), // 1–12 (may be smaller than start, e.g. Nov–Feb)
        createdAt: createdAt(),
    },
    (t) => [
        index('plants_combination_id_idx').on(t.combinationId),
        check('plants_difficulty_check', sql`${t.difficulty} BETWEEN 1 AND 5`),
        check('plants_month_check', sql`${t.monthStart} BETWEEN 1 AND 12 AND ${t.monthEnd} BETWEEN 1 AND 12`),
    ],
)

export const lifecycles = sqliteTable(
    'lifecycles',
    {
        id: id(),
        plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
        position: integer('position').notNull().default(0),
        title: text('title').notNull(),
        content: text('content').notNull(),
    },
    (t) => [index('lifecycles_plant_id_idx').on(t.plantId, t.position)],
)

export const tips = sqliteTable(
    'tips',
    {
        id: id(),
        plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
        title: text('title').notNull(),
        content: text('content').notNull(),
    },
    (t) => [index('tips_plant_id_idx').on(t.plantId, t.position)],
)

export const diseases = sqliteTable(
    'diseases',
    {
        id: id(),
        plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        label: text('label'),
        content: text('content').notNull(),
    },
    (t) => [index('diseases_plant_id_idx').on(t.plantId)],
)

/* ─────────────── Image links: which images belong to what, in carousel order ─────────────── */

export const noteImages = sqliteTable(
    'note_images',
    {
        noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
    },
    (t) => [primaryKey({ columns: [t.noteId, t.imageId] })],
)

export const postImages = sqliteTable(
    'post_images',
    {
        postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
    },
    (t) => [primaryKey({ columns: [t.postId, t.imageId] })],
)

export const blogImages = sqliteTable(
    'blog_images',
    {
        blogId: integer('blog_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
    },
    (t) => [primaryKey({ columns: [t.blogId, t.imageId] })],
)

/** Photos placed inside a blog's text (the editor's image blocks); kept in sync on every save */
export const blogContentImages = sqliteTable(
    'blog_content_images',
    {
        blogId: integer('blog_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
    },
    (t) => [primaryKey({ columns: [t.blogId, t.imageId] })],
)

export const plantImages = sqliteTable(
    'plant_images',
    {
        plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
        imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
    },
    (t) => [primaryKey({ columns: [t.plantId, t.imageId] })],
)

/* ─────────────── Relations: let one query load an item with its children ─────────────── */

export const notesRelations = relations(notes, ({ many }) => ({
    images: many(noteImages),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
    user: one(user, { fields: [posts.userId], references: [user.id] }),
    replies: many(postReplies),
    images: many(postImages),
}))

export const postRepliesRelations = relations(postReplies, ({ one, many }) => ({
    post: one(posts, { fields: [postReplies.postId], references: [posts.id] }),
    user: one(user, { fields: [postReplies.userId], references: [user.id] }),
    parent: one(postReplies, {
        fields: [postReplies.parentReplyId],
        references: [postReplies.id],
        relationName: 'reply_replies',
    }),
    replies: many(postReplies, { relationName: 'reply_replies' }),
}))

export const blogsRelations = relations(blogs, ({ many }) => ({
    comments: many(blogComments),
    images: many(blogImages),
    contentImages: many(blogContentImages),
}))

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
    blog: one(blogs, { fields: [blogComments.blogId], references: [blogs.id] }),
    user: one(user, { fields: [blogComments.userId], references: [user.id] }),
    parent: one(blogComments, {
        fields: [blogComments.parentCommentId],
        references: [blogComments.id],
        relationName: 'comment_replies',
    }),
    replies: many(blogComments, { relationName: 'comment_replies' }),
}))

export const combinationsRelations = relations(combinations, ({ many }) => ({
    plants: many(plants),
}))

export const plantsRelations = relations(plants, ({ one, many }) => ({
    combination: one(combinations, { fields: [plants.combinationId], references: [combinations.id] }),
    lifecycles: many(lifecycles),
    tips: many(tips),
    diseases: many(diseases),
    images: many(plantImages),
}))

export const lifecyclesRelations = relations(lifecycles, ({ one }) => ({
    plant: one(plants, { fields: [lifecycles.plantId], references: [plants.id] }),
}))

export const tipsRelations = relations(tips, ({ one }) => ({
    plant: one(plants, { fields: [tips.plantId], references: [plants.id] }),
}))

export const diseasesRelations = relations(diseases, ({ one }) => ({
    plant: one(plants, { fields: [diseases.plantId], references: [plants.id] }),
}))

export const noteImagesRelations = relations(noteImages, ({ one }) => ({
    note: one(notes, { fields: [noteImages.noteId], references: [notes.id] }),
    image: one(images, { fields: [noteImages.imageId], references: [images.id] }),
}))

export const postImagesRelations = relations(postImages, ({ one }) => ({
    post: one(posts, { fields: [postImages.postId], references: [posts.id] }),
    image: one(images, { fields: [postImages.imageId], references: [images.id] }),
}))

export const blogImagesRelations = relations(blogImages, ({ one }) => ({
    blog: one(blogs, { fields: [blogImages.blogId], references: [blogs.id] }),
    image: one(images, { fields: [blogImages.imageId], references: [images.id] }),
}))

export const blogContentImagesRelations = relations(blogContentImages, ({ one }) => ({
    blog: one(blogs, { fields: [blogContentImages.blogId], references: [blogs.id] }),
    image: one(images, { fields: [blogContentImages.imageId], references: [images.id] }),
}))

export const plantImagesRelations = relations(plantImages, ({ one }) => ({
    plant: one(plants, { fields: [plantImages.plantId], references: [plants.id] }),
    image: one(images, { fields: [plantImages.imageId], references: [images.id] }),
}))
