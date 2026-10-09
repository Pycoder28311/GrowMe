import { BLOG_KIND_LABELS } from '@growme/shared'
import { desc, inArray, sql } from 'drizzle-orm'
import type { Db } from '../../db'
import { blogs } from '../../db/schema'
import { HttpError } from '../../lib/errors'

/** The fields of a save that hold blog links: where to report (e.g. "lifecycles.2.content") and their ids */
export type BlogLinkField = { path: string; ids: number[] }

/**
 * Throws 400 UNKNOWN_REFERENCE at each field whose links point to a blog that doesn't exist
 * (one query for the whole save). `selfId`: a blog can't link to itself.
 */
export async function assertBlogLinks(db: Db, fields: BlogLinkField[], selfId?: number | null) {
  const ids = [...new Set(fields.flatMap((f) => f.ids))]
  if (ids.length === 0) return
  const found = new Set((await db.select({ id: blogs.id }).from(blogs).where(inArray(blogs.id, ids))).map((b) => b.id))
  const details = fields
    .filter((f) => f.ids.some((id) => !found.has(id) || id === selfId))
    .map((f) => ({ path: f.path, message: 'Unknown blog link' }))
  if (details.length > 0) throw new HttpError(400, 'UNKNOWN_REFERENCE', 'Unknown blog link', details)
}

/**
 * How many texts link to a blog: plain texts holding `](blog:N)` and articles holding a `blog:N`
 * link. LIKE over the text columns: fine for a dashboard action, not for the app.
 */
export async function linkedFromCount(db: Db, blogId: number) {
  const plain = `%](blog:${Number(blogId)})%`
  const rich = `%"href":"blog:${Number(blogId)}"%`
  const row = await db.get<{ n: number }>(sql`SELECT
      (SELECT count(*) FROM plants WHERE description LIKE ${plain} OR native LIKE ${plain})
    + (SELECT count(*) FROM lifecycles WHERE content LIKE ${plain})
    + (SELECT count(*) FROM tips WHERE content LIKE ${plain})
    + (SELECT count(*) FROM diseases WHERE content LIKE ${plain})
    + (SELECT count(*) FROM combinations WHERE description LIKE ${plain})
    + (SELECT count(*) FROM blogs WHERE id != ${blogId} AND content LIKE ${rich}) AS n`)
  return row?.n ?? 0
}

/** Every blog, for the dashboard's link picker (`SearchOptions source="blogs"`); `exceptId` left out */
export async function blogLinkOptions(db: Db, exceptId?: number) {
  const rows = await db
    .select({ id: blogs.id, name: blogs.name, kind: blogs.kind })
    .from(blogs)
    .orderBy(desc(blogs.id))
  return rows
    .filter((b) => b.id !== exceptId)
    .map((b) => ({ value: b.id, label: b.name, hint: BLOG_KIND_LABELS[b.kind] }))
}
