import type { Post, PostCreate, PostFilter, PostUpdate } from '@growme/shared'
import { and, asc, desc, eq, gt, inArray } from 'drizzle-orm'
import { plantImages, plants, postImages, postReplies, posts } from '../../db/schema'
import { hasChanges, ownedOrAdmin, userId, type Ctx, type Repo, type Store } from '../../lib/crud'
import { beforeCursor, encodeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { assertExists, removedIds, replaceLinks, runBatch, type LinkTable } from '../../lib/relations'
import { authorColumns, toAuthor } from '../authors'
import { assertCanLinkImages, deleteImages, imageUrl, toImageRefs } from '../images/images.repo'
import { deleteLikesOf } from '../likes/likes.repo'

const postImageLinks: LinkTable<typeof postImages> = {
  table: postImages,
  parent: postImages.postId,
  toRow: (postId, imageId, position) => ({ postId, imageId, position }),
}

const withAll = {
  user: authorColumns,
  images: { orderBy: asc(postImages.position), with: { image: true } },
  // The linked plant's name and first photo
  plant: {
    columns: { id: true, name: true },
    with: { images: { orderBy: asc(plantImages.position), limit: 1, with: { image: { columns: { key: true } } } } },
  },
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
  plant: p.plant
    ? { id: p.plant.id, name: p.plant.name, image: p.plant.images[0] ? imageUrl(env, p.plant.images[0].image.key) : null }
    : null,
  likeCount: p.likeCount,
  replyCount: p.replyCount,
  createdAt: p.createdAt.toISOString(),
})

/** Posts by id, in the order of `ids` (ids of deleted posts are left out) */
export async function postsByIds(ctx: Ctx, ids: number[]): Promise<Post[]> {
  if (ids.length === 0) return []
  const rows = await ctx.db.query.posts.findMany({ where: inArray(posts.id, ids), with: withAll })
  const byId = new Map(rows.map((p) => [p.id, p]))
  return ids.flatMap((id) => {
    const post = byId.get(id)
    return post ? [toJson(ctx.env, post)] : []
  })
}

/** Throws 400 UNKNOWN_REFERENCE when the post is linked to a plant that doesn't exist */
const assertPlant = async (ctx: Ctx, plantId: number | null | undefined) => {
  if (plantId) await assertExists(ctx.db, plants, plants.id, plantId, 'plantId')
}

/** Public read, signed-in create, owners edit, owners or admins delete */
export const postsRepo: Repo<PostCreate, PostUpdate, Post, PostFilter> = {
  async list(ctx, page, { plantId, sort = 'newest' }) {
    const aboutPlant = plantId ? eq(posts.plantId, plantId) : undefined
    const query = { limit: fetchLimit(page), with: withAll } as const

    // Most liked first: the cursor is how many posts the client already has (likes change while it
    // reads, so an id can't mark the place), newer first among equal likes
    if (sort === 'liked') {
      const offset = page?.cursor ?? 0
      const rows = await ctx.db.query.posts.findMany({
        ...query,
        where: aboutPlant,
        orderBy: [desc(posts.likeCount), desc(posts.id)],
        offset,
      })
      if (!page || rows.length <= page.limit) return mapPage({ items: rows, nextCursor: null }, (p) => toJson(ctx.env, p))
      return mapPage({ items: rows.slice(0, page.limit), nextCursor: encodeCursor(offset + page.limit) }, (p) => toJson(ctx.env, p))
    }

    // Oldest first: ids go up, so the cursor is the last id and the next page is above it
    const oldest = sort === 'oldest'
    const rows = await ctx.db.query.posts.findMany({
      ...query,
      where: and(oldest ? (page?.cursor ? gt(posts.id, page.cursor) : undefined) : beforeCursor(posts.id, page), aboutPlant),
      orderBy: oldest ? asc(posts.id) : desc(posts.id),
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
    await assertPlant(ctx, fields.plantId)
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
    await assertPlant(ctx, fields.plantId)

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
