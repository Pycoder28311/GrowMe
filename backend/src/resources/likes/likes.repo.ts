import type { LikedType, LikeState, MyLike } from '@growme/shared'
import { and, eq, inArray, sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import { blogComments, blogs, likes, postReplies, posts } from '../../db/schema'
import { userId, type Ctx } from '../../lib/crud'
import { notFound } from '../../lib/errors'
import type { Db } from '../../db'

/**
 * The table behind each liked type. All four have the same `id` and `likeCount` columns, so one
 * builder type serves them all (typed as posts; the real table is used at runtime).
 */
const TARGETS = {
  post: posts,
  post_reply: postReplies,
  blog: blogs,
  blog_comment: blogComments,
} as unknown as Record<LikedType, typeof posts>

/** "I currently like this" (a like, not a dislike) */
const iLikeIt = (type: LikedType, id: number, user: string) =>
  sql`EXISTS (SELECT 1 FROM ${likes} WHERE ${likes.likedType} = ${type} AND ${likes.likedId} = ${id}
      AND ${likes.userId} = ${user} AND ${likes.isLike} = 1)`

/** +1 / -1 on the target's like_count, only when `condition` holds (checked inside the same batch) */
const changeCount = (db: Db, type: LikedType, id: number, delta: 1 | -1, condition: SQL) => {
  const target = TARGETS[type]
  return db
    .update(target)
    .set({ likeCount: sql`${target.likeCount} + ${delta}` })
    .where(and(eq(target.id, id), condition))
}

async function likeCountOf(db: Db, type: LikedType, id: number) {
  const target = TARGETS[type]
  const row = await db.select({ likeCount: target.likeCount }).from(target).where(eq(target.id, id)).get()
  if (!row) throw notFound()
  return row.likeCount
}

/**
 * Statement that deletes the likes of deleted items (likes has no foreign key, so run it in the same
 * batch as the delete). `ids`: one id, or a subquery / raw SQL list in parentheses.
 */
export const deleteLikesOf = (db: Db, type: LikedType, ids: number | SQLWrapper) =>
  db
    .delete(likes)
    .where(and(eq(likes.likedType, type), typeof ids === 'number' ? eq(likes.likedId, ids) : inArray(likes.likedId, ids)))

export const likesRepo = {
  /** Like (isLike true) or dislike (false). like_count counts likes only; repeating changes nothing. */
  async set(ctx: Ctx, type: LikedType, id: number, isLike: boolean): Promise<LikeState> {
    const user = userId(ctx)
    await likeCountOf(ctx.db, type, id) // 404 when the item doesn't exist
    await ctx.db.batch([
      isLike
        ? changeCount(ctx.db, type, id, 1, sql`NOT ${iLikeIt(type, id, user)}`)
        : changeCount(ctx.db, type, id, -1, iLikeIt(type, id, user)),
      ctx.db
        .insert(likes)
        .values({ userId: user, likedType: type, likedId: id, isLike })
        .onConflictDoUpdate({ target: [likes.likedType, likes.likedId, likes.userId], set: { isLike } }),
    ])
    return { likeCount: await likeCountOf(ctx.db, type, id), isLike }
  },

  /** Removes my like or dislike; nothing happens when there is none */
  async remove(ctx: Ctx, type: LikedType, id: number): Promise<LikeState> {
    const user = userId(ctx)
    await ctx.db.batch([
      changeCount(ctx.db, type, id, -1, iLikeIt(type, id, user)),
      ctx.db
        .delete(likes)
        .where(and(eq(likes.likedType, type), eq(likes.likedId, id), eq(likes.userId, user))),
    ])
    return { likeCount: await likeCountOf(ctx.db, type, id), isLike: null }
  },

  /** My reactions to a set of items (one indexed lookup per id) */
  async mine(ctx: Ctx, type: LikedType, ids: number[]): Promise<MyLike[]> {
    const rows = await ctx.db
      .select({ id: likes.likedId, isLike: likes.isLike })
      .from(likes)
      .where(and(eq(likes.likedType, type), inArray(likes.likedId, ids), eq(likes.userId, userId(ctx))))
    return rows
  },
}
