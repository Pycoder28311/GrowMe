import type { BlogSave } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { blogImages, blogs } from '../../../db/schema'
import type { Store } from '../../../lib/crud'
import { removedIds, replaceLinks, runBatch } from '../../../lib/relations'
import { assertAdminImages, deleteImages } from '../../images/images.repo'
import { blogImageLinks } from '../../blogs/blogs.repo'

/**
 * Creates (id null) or replaces a blog with its photos, as the dashboard's form sends it.
 * The text arrives as the editor's document, already cleaned by the schema, and is stored as JSON.
 */
export async function saveBlog({ db, env }: Store, id: number | null, { imageIds, name, content }: BlogSave) {
  const fields = { name, content: JSON.stringify(content) }
  if (id === null) {
    await assertAdminImages(db, imageIds)
    const { id: newId } = await db.insert(blogs).values(fields).returning({ id: blogs.id }).get()
    try {
      await runBatch(db, [...replaceLinks(db, blogImageLinks, newId, imageIds)])
    } catch (err) {
      await db.delete(blogs).where(eq(blogs.id, newId)) // no half-saved blog
      throw err
    }
    return { id: newId }
  }

  const existing = await db.query.blogs.findFirst({
    where: eq(blogs.id, id),
    columns: { id: true },
    with: { images: { columns: { imageId: true }, orderBy: asc(blogImages.position) } },
  })
  if (!existing) return null

  const before = existing.images.map((l) => l.imageId)
  await assertAdminImages(db, imageIds, before)
  await runBatch(db, [
    db.update(blogs).set(fields).where(eq(blogs.id, id)),
    ...replaceLinks(db, blogImageLinks, id, imageIds),
  ])
  await deleteImages({ db, env }, removedIds(before, imageIds))
  return { id }
}
