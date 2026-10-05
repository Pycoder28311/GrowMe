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
})

/** Send only what changes; imageIds replaces the whole list */
export const postUpdate = z.object({
  title: title.optional(),
  content: content.optional(),
  imageIds: imageIds.optional(),
})

export type PostCreate = z.infer<typeof postCreate>
export type PostUpdate = z.infer<typeof postUpdate>

export type Post = {
  id: number
  title: string
  content: string
  author: Author
  images: ImageRef[]
  likeCount: number
  replyCount: number
  createdAt: string
}

/* ─────────────── Replies ─────────────── */

export const replyCreate = z.object({
  postId: entityId,
  content: replyContent,
})

export const replyUpdate = z.object({
  content: replyContent,
})

/** GET /api/post-replies?postId=1 */
export const replyFilter = z.object({
  postId: queryId,
})

export type ReplyCreate = z.infer<typeof replyCreate>
export type ReplyUpdate = z.infer<typeof replyUpdate>
export type ReplyFilter = z.infer<typeof replyFilter>

export type PostReply = {
  id: number
  postId: number
  content: string
  author: Author
  likeCount: number
  createdAt: string
}
