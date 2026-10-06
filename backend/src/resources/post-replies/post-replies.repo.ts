import type { PostReply, ReplyCreate, ReplyFilter, ReplyUpdate } from '@growme/shared'
import { and, desc, eq, exists, sql } from 'drizzle-orm'
import { postReplies, posts } from '../../db/schema'
import type { Db } from '../../db'
import { ownedOrAdmin, userId, type Ctx, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { assertExists } from '../../lib/relations'
import { authorColumns, toAuthor } from '../authors'
import { deleteLikesOf } from '../likes/likes.repo'

const findWhere = (ctx: Ctx, where: ReturnType<typeof and>) =>
  ctx.db.query.postReplies.findFirst({ where, with: { user: authorColumns } })

type Row = NonNullable<Awaited<ReturnType<typeof findWhere>>>

const toJson = (r: Row): PostReply => ({
  id: r.id,
  postId: r.postId,
  content: r.content,
  author: toAuthor(r.user),
  likeCount: r.likeCount,
  createdAt: r.createdAt.toISOString(),
})

/** Replies of one post (?postId=), newest first. Keeps posts.reply_count in the same batch. */
export const postRepliesRepo: Repo<ReplyCreate, ReplyUpdate, PostReply, ReplyFilter> = {
  async list(ctx, page, { postId }) {
    const rows = await ctx.db.query.postReplies.findMany({
      where: and(eq(postReplies.postId, postId), beforeCursor(postReplies.id, page)),
      orderBy: desc(postReplies.id),
      limit: fetchLimit(page),
      with: { user: authorColumns },
    })
    return mapPage(
      toPage(rows, page, (r) => r.id),
      toJson,
    )
  },

  async get(ctx, id) {
    const reply = await findWhere(ctx, eq(postReplies.id, id))
    return reply ? toJson(reply) : null
  },

  async create(ctx, { postId, content }) {
    await assertExists(ctx.db, posts, posts.id, postId, 'postId')
    const [[reply]] = await ctx.db.batch([
      ctx.db.insert(postReplies).values({ postId, content, userId: userId(ctx) }).returning(),
      ctx.db
        .update(posts)
        .set({ replyCount: sql`${posts.replyCount} + 1` })
        .where(eq(posts.id, postId)),
    ])
    return toJson((await findWhere(ctx, eq(postReplies.id, reply.id)))!)
  },

  async update(ctx, id, { content }) {
    const [row] = await ctx.db
      .update(postReplies)
      .set({ content })
      .where(and(eq(postReplies.id, id), eq(postReplies.userId, userId(ctx))))
      .returning({ id: postReplies.id })
    return row ? toJson((await findWhere(ctx, eq(postReplies.id, id)))!) : null
  },

  async remove(ctx, id) {
    const existing = await findWhere(ctx, and(eq(postReplies.id, id), ownedOrAdmin(ctx, postReplies.userId)))
    if (!existing) return false
    return deletePostReply(ctx.db, id)
  },
}

/** Deletes a reply with its likes and lowers its post's reply count. No ownership check: callers do it. */
export async function deletePostReply(db: Db, id: number) {
  const existing = await db.select({ postId: postReplies.postId }).from(postReplies).where(eq(postReplies.id, id)).get()
  if (!existing) return false
  const stillThere = db.select({ id: postReplies.id }).from(postReplies).where(eq(postReplies.id, id))
  await db.batch([
    // -1 only if the reply still exists in this transaction (no double count on parallel deletes)
    db
      .update(posts)
      .set({ replyCount: sql`${posts.replyCount} - 1` })
      .where(and(eq(posts.id, existing.postId), exists(stillThere))),
    deleteLikesOf(db, 'post_reply', id),
    db.delete(postReplies).where(eq(postReplies.id, id)),
  ])
  return true
}
