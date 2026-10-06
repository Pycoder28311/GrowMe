import type { PostReply, ReplyCreate, ReplyFilter, ReplyUpdate } from '@growme/shared'
import { and, desc, eq, isNull, sql, type SQL } from 'drizzle-orm'
import type { Db } from '../../db'
import { postReplies, posts, user } from '../../db/schema'
import { HttpError } from '../../lib/errors'
import { ownedOrAdmin, userId, type Ctx, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { assertExists } from '../../lib/relations'
import { toAuthor } from '../authors'
import { deleteLikesOf } from '../likes/likes.repo'

/** Replies with their author and their number of direct answers (counted, never stored: it can't drift) */
const selectReplies = (db: Db) =>
  db
    .select({
      reply: postReplies,
      author: { id: user.id, name: user.name, image: user.image },
      replyCount: sql<number>`(SELECT count(*) FROM post_replies a WHERE a.parent_reply_id = ${postReplies.id})`,
    })
    .from(postReplies)
    .innerJoin(user, eq(user.id, postReplies.userId))

type Row = { reply: typeof postReplies.$inferSelect; author: { id: string; name: string; image: string | null }; replyCount: number }

const toJson = ({ reply: r, author, replyCount }: Row): PostReply => ({
  id: r.id,
  postId: r.postId,
  parentReplyId: r.parentReplyId,
  content: r.content,
  author: toAuthor(author),
  likeCount: r.likeCount,
  replyCount,
  createdAt: r.createdAt.toISOString(),
})

const findWhere = (db: Db, where: SQL | undefined) => selectReplies(db).where(where).get()

/** A reply and all its answers, at any depth: `SELECT <what> FROM thread` */
const thread = (id: number, what: string) =>
  sql.raw(`WITH RECURSIVE thread(id) AS (
    SELECT id FROM post_replies WHERE id = ${Number(id)}
    UNION ALL
    SELECT r.id FROM post_replies r JOIN thread ON r.parent_reply_id = thread.id
  ) SELECT ${what} FROM thread`)

/**
 * Replies of one post (?postId=): those answering the post, or the answers to ?parentReplyId=.
 * Newest first. posts.reply_count counts replies at every level and is kept in the same batch.
 */
export const postRepliesRepo: Repo<ReplyCreate, ReplyUpdate, PostReply, ReplyFilter> = {
  async list(ctx, page, { postId, parentReplyId }) {
    const rows = await selectReplies(ctx.db)
      .where(
        and(
          eq(postReplies.postId, postId),
          parentReplyId ? eq(postReplies.parentReplyId, parentReplyId) : isNull(postReplies.parentReplyId),
          beforeCursor(postReplies.id, page),
        ),
      )
      .orderBy(desc(postReplies.id))
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (r) => r.reply.id),
      toJson,
    )
  },

  async get(ctx, id) {
    const row = await findWhere(ctx.db, eq(postReplies.id, id))
    return row ? toJson(row) : null
  },

  async create(ctx, { postId, parentReplyId, content }) {
    await assertExists(ctx.db, posts, posts.id, postId, 'postId')
    if (parentReplyId) {
      const parent = await ctx.db
        .select({ postId: postReplies.postId })
        .from(postReplies)
        .where(eq(postReplies.id, parentReplyId))
        .get()
      if (parent?.postId !== postId) {
        throw new HttpError(400, 'UNKNOWN_REFERENCE', 'Unknown parentReplyId', [
          { path: 'parentReplyId', message: 'Not a reply of this post' },
        ])
      }
    }
    const [[reply]] = await ctx.db.batch([
      ctx.db.insert(postReplies).values({ postId, parentReplyId, content, userId: userId(ctx) }).returning(),
      ctx.db
        .update(posts)
        .set({ replyCount: sql`${posts.replyCount} + 1` })
        .where(eq(posts.id, postId)),
    ])
    return toJson((await findWhere(ctx.db, eq(postReplies.id, reply.id)))!)
  },

  async update(ctx, id, { content }) {
    const [row] = await ctx.db
      .update(postReplies)
      .set({ content })
      .where(and(eq(postReplies.id, id), eq(postReplies.userId, userId(ctx))))
      .returning({ id: postReplies.id })
    return row ? toJson((await findWhere(ctx.db, eq(postReplies.id, id)))!) : null
  },

  async remove(ctx, id) {
    const existing = await ctx.db
      .select({ id: postReplies.id })
      .from(postReplies)
      .where(and(eq(postReplies.id, id), ownedOrAdmin(ctx, postReplies.userId)))
      .get()
    if (!existing) return false
    return deletePostReply(ctx.db, id)
  },
}

/**
 * Deletes a reply with all its answers and their likes, and lowers the post's reply count by the
 * whole thread. No ownership check: callers do it.
 */
export async function deletePostReply(db: Db, id: number) {
  const existing = await db.select({ postId: postReplies.postId }).from(postReplies).where(eq(postReplies.id, id)).get()
  if (!existing) return false
  await db.batch([
    // counted inside the transaction: 0 if a parallel request already deleted it
    db
      .update(posts)
      .set({ replyCount: sql`${posts.replyCount} - (${thread(id, 'count(*)')})` })
      .where(eq(posts.id, existing.postId)),
    deleteLikesOf(db, 'post_reply', sql`(${thread(id, 'id')})`),
    db.delete(postReplies).where(eq(postReplies.id, id)), // its answers cascade
  ])
  return true
}
