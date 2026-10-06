import type { Post, PostCreate, PostUpdate } from '@growme/shared'
import { and, asc, desc, eq } from 'drizzle-orm'
import { postImages, postReplies, posts } from '../../db/schema'
import { hasChanges, ownedOrAdmin, userId, type Ctx, type Repo, type Store } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { removedIds, replaceLinks, runBatch, type LinkTable } from '../../lib/relations'
import { authorColumns, toAuthor } from '../authors'
import { assertCanLinkImages, deleteImages, toImageRefs } from '../images/images.repo'
import { deleteLikesOf } from '../likes/likes.repo'

const postImageLinks: LinkTable<typeof postImages> = {
  table: postImages,
  parent: postImages.postId,
  toRow: (postId, imageId, position) => ({ postId, imageId, position }),
}

const withAll = {
  user: authorColumns,
  images: { orderBy: asc(postImages.position), with: { image: true } },
} as const

const findWhere = (ctx: Ctx, where: ReturnType<typeof and>) =>
  ctx.db.query.posts.findFirst({ where, with: withAll })

type Row = NonNullable<Awaited<ReturnType<typeof findWhere>>>

/** The only fields that leave the server */
const toJson = (env: CloudflareBindings, p: Row): Post => ({
  id: p.id,
  title: p.title,
  content: p.content,
  author: toAuthor(p.user),
  images: toImageRefs(env, p.images),
  likeCount: p.likeCount,
  replyCount: p.replyCount,
  createdAt: p.createdAt.toISOString(),
})

/** Public read, signed-in create, owners edit, owners or admins delete */
export const postsRepo: Repo<PostCreate, PostUpdate, Post> = {
  async list(ctx, page) {
    const rows = await ctx.db.query.posts.findMany({
      where: beforeCursor(posts.id, page),
      orderBy: desc(posts.id),
      limit: fetchLimit(page),
      with: withAll,
    })
    return mapPage(
      toPage(rows, page, (p) => p.id),
      (p) => toJson(ctx.env, p),
    )
  },

  async get(ctx, id) {
    const post = await findWhere(ctx, eq(posts.id, id))
    return post ? toJson(ctx.env, post) : null
  },

  async create(ctx, { imageIds, ...fields }) {
    await assertCanLinkImages(ctx, imageIds)
    const { id } = await ctx.db
      .insert(posts)
      .values({ ...fields, userId: userId(ctx) })
      .returning()
      .get()
    await ctx.db.batch([...replaceLinks(ctx.db, postImageLinks, id, imageIds)])
    return toJson(ctx.env, (await findWhere(ctx, eq(posts.id, id)))!)
  },

  async update(ctx, id, { imageIds, ...fields }) {
    const existing = await findWhere(ctx, and(eq(posts.id, id), eq(posts.userId, userId(ctx))))
    if (!existing) return null
    const before = existing.images.map((l) => l.imageId)
    if (imageIds) await assertCanLinkImages(ctx, imageIds, before)

    if (!hasChanges(fields) && !imageIds) return toJson(ctx.env, existing)
    await runBatch(ctx.db, [
      ...(hasChanges(fields) ? [ctx.db.update(posts).set(fields).where(eq(posts.id, id))] : []),
      ...(imageIds ? replaceLinks(ctx.db, postImageLinks, id, imageIds) : []),
    ])
    if (imageIds) await deleteImages(ctx, removedIds(before, imageIds))
    return toJson(ctx.env, (await findWhere(ctx, eq(posts.id, id)))!)
  },

  async remove(ctx, id) {
    const existing = await findWhere(ctx, and(eq(posts.id, id), ownedOrAdmin(ctx, posts.userId)))
    if (!existing) return false
    return deletePost(ctx, id)
  },
}

/** Deletes a post with its replies, their likes and its photos. No ownership check: callers do it. */
export async function deletePost({ db, env }: Store, id: number) {
  const links = await db.select({ imageId: postImages.imageId }).from(postImages).where(eq(postImages.postId, id))
  const replies = db.select({ id: postReplies.id }).from(postReplies).where(eq(postReplies.postId, id))
  // Likes have no foreign key: remove those of the post and its replies together with the post
  const [, , deleted] = await db.batch([
    deleteLikesOf(db, 'post_reply', replies),
    deleteLikesOf(db, 'post', id),
    db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id }), // replies and image links cascade
  ])
  if (deleted.length === 0) return false
  await deleteImages(
    { db, env },
    links.map((l) => l.imageId),
  )
  return true
}
