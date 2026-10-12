import { z } from 'zod'
import { entityId, imageIds, queryId, type Author, type ImageRef } from './common'

const title = z.string().trim().min(1).max(200)
const content = z.string().trim().min(1).max(10000)
const replyContent = z.string().trim().min(1).max(2000)

/* ─────────────── Posts ─────────────── */

export const postCreate = z.object({
  title,
  content,
  imageIds: imageIds.default([]),
  /** The plant the post is about; omit (or null) for none */
  plantId: entityId.nullable().default(null),
})

/** Send only what changes; imageIds replaces the whole list */
export const postUpdate = z.object({
  title: title.optional(),
  content: content.optional(),
  imageIds: imageIds.optional(),
  /** null unlinks the plant */
  plantId: entityId.nullable().optional(),
})

/** The orders of the posts list: newest first (default), oldest first, most liked first */
export const POST_SORTS = ['newest', 'oldest', 'liked'] as const
export type PostSort = (typeof POST_SORTS)[number]

/**
 * GET /api/posts                 every post, newest first
 * GET /api/posts?plantId=3       the posts about plant 3
 * GET /api/posts?sort=liked      newest | oldest | liked (most likes first, newer first among equals)
 */
export const postFilter = z.object({
  plantId: queryId.optional(),
  sort: z.enum(POST_SORTS).optional(),
})

export type PostCreate = z.infer<typeof postCreate>
export type PostUpdate = z.infer<typeof postUpdate>
export type PostFilter = z.infer<typeof postFilter>

/** The plant a post is about: enough for a small link to its page */
export type PostPlant = { id: number; name: string; image: string | null }

export type Post = {
  id: number
  title: string
  content: string
  author: Author
  images: ImageRef[]
  /** null = not about one plant */
  plant: PostPlant | null
  likeCount: number
  replyCount: number
  createdAt: string
}

/* ─────────────── Replies ─────────────── */

export const replyCreate = z.object({
  postId: entityId,
  /** The reply this one answers; omit (or null) to answer the post itself */
  parentReplyId: entityId.nullable().default(null),
  content: replyContent,
})

export const replyUpdate = z.object({
  content: replyContent,
})

/**
 * GET /api/post-replies?postId=1                    replies to the post itself
 * GET /api/post-replies?postId=1&parentReplyId=5    answers to reply 5
 */
export const replyFilter = z.object({
  postId: queryId,
  parentReplyId: queryId.optional(),
})

export type ReplyCreate = z.infer<typeof replyCreate>
export type ReplyUpdate = z.infer<typeof replyUpdate>
export type ReplyFilter = z.infer<typeof replyFilter>

export type PostReply = {
  id: number
  postId: number
  /** null = answers the post itself */
  parentReplyId: number | null
  content: string
  author: Author
  likeCount: number
  /** Direct answers to this reply (load them with ?parentReplyId=) */
  replyCount: number
  createdAt: string
}
