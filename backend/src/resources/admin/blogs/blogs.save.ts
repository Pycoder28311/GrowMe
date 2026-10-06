import { richImageIds, type BlogSave } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { blogImages, blogs } from '../../../db/schema'
import type { Store } from '../../../lib/crud'
import { removedIds, replaceLinks, runBatch } from '../../../lib/relations'
import { assertAdminImages, deleteImages } from '../../images/images.repo'
import { blogContentImageLinks, blogImageLinks } from '../../blogs/blogs.repo'

/** The link rows of a blog: cover photos (in order) and photos inside the text */
const linkStatements = (db: Store['db'], blogId: number, coverIds: number[], textIds: number[]) => [
  ...replaceLinks(db, blogImageLinks, blogId, coverIds),
  ...replaceLinks(db, blogContentImageLinks, blogId, textIds),
]

/**
 * Creates (id null) or replaces a blog with its photos, as the dashboard's form sends it.
 * The text arrives as the editor's document, already cleaned by the schema, and is stored as JSON;
 * the photos placed in it are linked in blog_content_images, and photos no longer used are deleted.
 */
export async function saveBlog({ db, env }: Store, id: number | null, { imageIds, name, content }: BlogSave) {
  const fields = { name, content: JSON.stringify(content) }
  const textIds = richImageIds(content)
  if (id === null) {
    await assertAdminImages(db, [...imageIds, ...textIds])
    const { id: newId } = await db.insert(blogs).values(fields).returning({ id: blogs.id }).get()
    try {
      await runBatch(db, linkStatements(db, newId, imageIds, textIds))
    } catch (err) {
      await db.delete(blogs).where(eq(blogs.id, newId)) // no half-saved blog
      throw err
    }
    return { id: newId }
  }

  const existing = await db.query.blogs.findFirst({
    where: eq(blogs.id, id),
    columns: { id: true },
    with: {
      images: { columns: { imageId: true }, orderBy: asc(blogImages.position) },
      contentImages: { columns: { imageId: true } },
    },
  })
  if (!existing) return null

  const before = [...existing.images, ...existing.contentImages].map((l) => l.imageId)
  const after = [...imageIds, ...textIds]
  await assertAdminImages(db, after, before)
  await runBatch(db, [db.update(blogs).set(fields).where(eq(blogs.id, id)), ...linkStatements(db, id, imageIds, textIds)])
  await deleteImages({ db, env }, removedIds([...new Set(before)], after))
  return { id }
}
