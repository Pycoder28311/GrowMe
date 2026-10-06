import type { Blog, BlogCreate, BlogUpdate } from '@growme/shared'
import { asc, desc, eq } from 'drizzle-orm'
import { blogComments, blogContentImages, blogImages, blogs } from '../../db/schema'
import { hasChanges, type Ctx, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { removedIds, replaceLinks, runBatch, type LinkTable } from '../../lib/relations'
import { assertCanLinkImages, deleteImages, toImageRefs } from '../images/images.repo'
import { deleteLikesOf } from '../likes/likes.repo'

export const blogImageLinks: LinkTable<typeof blogImages> = {
  table: blogImages,
  parent: blogImages.blogId,
  toRow: (blogId, imageId, position) => ({ blogId, imageId, position }),
}

/** Photos inside a blog's text: one row per image (see saveBlog in the dashboard) */
export const blogContentImageLinks: LinkTable<typeof blogContentImages> = {
  table: blogContentImages,
  parent: blogContentImages.blogId,
  toRow: (blogId, imageId) => ({ blogId, imageId }),
}

const withImages = {
  images: { orderBy: asc(blogImages.position), with: { image: true } },
  contentImages: { with: { image: true } },
} as const

const find = (ctx: Ctx, id: number) => ctx.db.query.blogs.findFirst({ where: eq(blogs.id, id), with: withImages })

type Row = NonNullable<Awaited<ReturnType<typeof find>>>

const toJson = (env: CloudflareBindings, b: Row): Blog => ({
  id: b.id,
  name: b.name,
  content: b.content,
  images: toImageRefs(env, b.images),
  contentImages: toImageRefs(env, b.contentImages),
  likeCount: b.likeCount,
  commentCount: b.commentCount,
  createdAt: b.createdAt.toISOString(),
})

/** Public read; admins write (enforced by the route's access mode) */
export const blogsRepo: Repo<BlogCreate, BlogUpdate, Blog> = {
  async list(ctx, page) {
    const rows = await ctx.db.query.blogs.findMany({
      where: beforeCursor(blogs.id, page),
      orderBy: desc(blogs.id),
      limit: fetchLimit(page),
      with: withImages,
    })
    return mapPage(
      toPage(rows, page, (b) => b.id),
      (b) => toJson(ctx.env, b),
    )
  },

  async get(ctx, id) {
    const blog = await find(ctx, id)
    return blog ? toJson(ctx.env, blog) : null
  },

  async create(ctx, { imageIds, ...fields }) {
    await assertCanLinkImages(ctx, imageIds)
    const { id } = await ctx.db.insert(blogs).values(fields).returning().get()
    await runBatch(ctx.db, [...replaceLinks(ctx.db, blogImageLinks, id, imageIds)])
    return toJson(ctx.env, (await find(ctx, id))!)
  },

  async update(ctx, id, { imageIds, ...fields }) {
    const existing = await find(ctx, id)
    if (!existing) return null
    const before = existing.images.map((l) => l.imageId)
    if (imageIds) await assertCanLinkImages(ctx, imageIds, before)

    if (!hasChanges(fields) && !imageIds) return toJson(ctx.env, existing)
    await runBatch(ctx.db, [
      ...(hasChanges(fields) ? [ctx.db.update(blogs).set(fields).where(eq(blogs.id, id))] : []),
      ...(imageIds ? replaceLinks(ctx.db, blogImageLinks, id, imageIds) : []),
    ])
    if (imageIds) await deleteImages(ctx, removedIds(before, imageIds))
    return toJson(ctx.env, (await find(ctx, id))!)
  },

  async remove(ctx, id) {
    const existing = await find(ctx, id)
    if (!existing) return false
    const comments = ctx.db.select({ id: blogComments.id }).from(blogComments).where(eq(blogComments.blogId, id))
    await ctx.db.batch([
      deleteLikesOf(ctx.db, 'blog_comment', comments),
      deleteLikesOf(ctx.db, 'blog', id),
      ctx.db.delete(blogs).where(eq(blogs.id, id)), // comments and image links cascade
    ])
    await deleteImages(ctx, [...existing.images, ...existing.contentImages].map((l) => l.imageId))
    return true
  },
}
