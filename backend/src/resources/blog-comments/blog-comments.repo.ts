import type { BlogComment, CommentCreate, CommentFilter, CommentUpdate } from '@growme/shared'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { blogComments, blogs } from '../../db/schema'
import { HttpError } from '../../lib/errors'
import type { Db } from '../../db'
import { ownedOrAdmin, userId, type Ctx, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { assertExists } from '../../lib/relations'
import { authorColumns, toAuthor } from '../authors'
import { deleteLikesOf } from '../likes/likes.repo'

const findWhere = (ctx: Ctx, where: ReturnType<typeof and>) =>
  ctx.db.query.blogComments.findFirst({ where, with: { user: authorColumns } })

type Row = NonNullable<Awaited<ReturnType<typeof findWhere>>>

const toJson = (c: Row): BlogComment => ({
  id: c.id,
  blogId: c.blogId,
  parentCommentId: c.parentCommentId,
  content: c.content,
  author: toAuthor(c.user),
  likeCount: c.likeCount,
  createdAt: c.createdAt.toISOString(),
})

/** A comment and all its answers, at any depth: `SELECT <what> FROM thread` */
const thread = (id: number, what: string) =>
  sql.raw(`WITH RECURSIVE thread(id) AS (
    SELECT id FROM blog_comments WHERE id = ${Number(id)}
    UNION ALL
    SELECT c.id FROM blog_comments c JOIN thread ON c.parent_comment_id = thread.id
  ) SELECT ${what} FROM thread`)

/**
 * Comments of one blog (?blogId=): top level, or the answers to ?parentCommentId=. Newest first.
 * Keeps blogs.comment_count in the same batch.
 */
export const blogCommentsRepo: Repo<CommentCreate, CommentUpdate, BlogComment, CommentFilter> = {
  async list(ctx, page, { blogId, parentCommentId }) {
    const rows = await ctx.db.query.blogComments.findMany({
      where: and(
        eq(blogComments.blogId, blogId),
        parentCommentId ? eq(blogComments.parentCommentId, parentCommentId) : isNull(blogComments.parentCommentId),
        beforeCursor(blogComments.id, page),
      ),
      orderBy: desc(blogComments.id),
      limit: fetchLimit(page),
      with: { user: authorColumns },
    })
    return mapPage(
      toPage(rows, page, (c) => c.id),
      toJson,
    )
  },

  async get(ctx, id) {
    const comment = await findWhere(ctx, eq(blogComments.id, id))
    return comment ? toJson(comment) : null
  },

  async create(ctx, { blogId, parentCommentId, content }) {
    await assertExists(ctx.db, blogs, blogs.id, blogId, 'blogId')
    if (parentCommentId) {
      const parent = await ctx.db
        .select({ blogId: blogComments.blogId })
        .from(blogComments)
        .where(eq(blogComments.id, parentCommentId))
        .get()
      if (parent?.blogId !== blogId) {
        throw new HttpError(400, 'UNKNOWN_REFERENCE', 'Unknown parentCommentId', [
          { path: 'parentCommentId', message: 'Not a comment of this blog' },
        ])
      }
    }
    const [[comment]] = await ctx.db.batch([
      ctx.db.insert(blogComments).values({ blogId, parentCommentId, content, userId: userId(ctx) }).returning(),
      ctx.db
        .update(blogs)
        .set({ commentCount: sql`${blogs.commentCount} + 1` })
        .where(eq(blogs.id, blogId)),
    ])
    return toJson((await findWhere(ctx, eq(blogComments.id, comment.id)))!)
  },

  async update(ctx, id, { content }) {
    const [row] = await ctx.db
      .update(blogComments)
      .set({ content })
      .where(and(eq(blogComments.id, id), eq(blogComments.userId, userId(ctx))))
      .returning({ id: blogComments.id })
    return row ? toJson((await findWhere(ctx, eq(blogComments.id, id)))!) : null
  },

  /** Deletes the comment with all its answers (they cascade), their likes and their share of the count */
  async remove(ctx, id) {
    const existing = await findWhere(ctx, and(eq(blogComments.id, id), ownedOrAdmin(ctx, blogComments.userId)))
    if (!existing) return false
    return deleteBlogComment(ctx.db, id)
  },
}

/**
 * Deletes a comment with all its answers and their likes, and lowers the blog's comment count.
 * No ownership check: callers do it.
 */
export async function deleteBlogComment(db: Db, id: number) {
  const existing = await db.select({ blogId: blogComments.blogId }).from(blogComments).where(eq(blogComments.id, id)).get()
  if (!existing) return false
  await db.batch([
    // counted inside the transaction: 0 if a parallel request already deleted it
    db
      .update(blogs)
      .set({ commentCount: sql`${blogs.commentCount} - (${thread(id, 'count(*)')})` })
      .where(eq(blogs.id, existing.blogId)),
    deleteLikesOf(db, 'blog_comment', sql`(${thread(id, 'id')})`),
    db.delete(blogComments).where(eq(blogComments.id, id)),
  ])
  return true
}
