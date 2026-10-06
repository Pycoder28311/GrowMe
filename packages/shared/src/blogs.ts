import { z } from 'zod'
import { entityId, imageIds, queryId, type Author, type ImageRef } from './common'
import { richDoc } from './rich-text'

const name = z.string().trim().min(1).max(200)
const content = z.string().trim().min(1).max(50000)
const commentContent = z.string().trim().min(1).max(2000)

/* ─────────────── Blogs (written by admins) ─────────────── */

export const blogCreate = z.object({
  name,
  content,
  imageIds: imageIds.default([]),
})

/** Send only what changes; imageIds replaces the whole list */
export const blogUpdate = z.object({
  name: name.optional(),
  content: content.optional(),
  imageIds: imageIds.optional(),
})

/**
 * The admin dashboard's blog form (POST/PUT /api/admin/blogs): every field, photos in order.
 * `content` is the editor's document (see rich-text.ts); it is stored as JSON text in blogs.content.
 */
export const blogSave = z.object({ name, content: richDoc, imageIds })

export type BlogCreate = z.infer<typeof blogCreate>
export type BlogSave = z.infer<typeof blogSave>
export type BlogUpdate = z.infer<typeof blogUpdate>

export type Blog = {
  id: number
  name: string
  /** The editor's document as JSON text, or older plain text: read it with parseRichContent() */
  content: string
  /** Cover photos, in order */
  images: ImageRef[]
  /** URLs of the photos inside the text (the document's image blocks have only their ids) */
  contentImages: ImageRef[]
  likeCount: number
  commentCount: number
  createdAt: string
}

/* ─────────────── Comments (nested) ─────────────── */

export const commentCreate = z.object({
  blogId: entityId,
  /** The comment this one answers; omit for a top-level comment */
  parentCommentId: entityId.nullable().default(null),
  content: commentContent,
})

export const commentUpdate = z.object({
  content: commentContent,
})

/**
 * GET /api/blog-comments?blogId=1                      top-level comments
 * GET /api/blog-comments?blogId=1&parentCommentId=5    answers to comment 5
 */
export const commentFilter = z.object({
  blogId: queryId,
  parentCommentId: queryId.optional(),
})

export type CommentCreate = z.infer<typeof commentCreate>
export type CommentUpdate = z.infer<typeof commentUpdate>
export type CommentFilter = z.infer<typeof commentFilter>

export type BlogComment = {
  id: number
  blogId: number
  parentCommentId: number | null
  content: string
  author: Author
  likeCount: number
  createdAt: string
}
