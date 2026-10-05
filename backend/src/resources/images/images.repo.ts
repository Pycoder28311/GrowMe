import { inArray } from 'drizzle-orm'
import type { Ctx } from '../../lib/crud'
import { images } from '../../db/schema'

/** Public URL for a stored image key */
export const imageUrl = (env: CloudflareBindings, key: string) => `${env.IMAGES_URL}/${key}`

/** Deletes image rows (their links cascade) and the files in R2 */
export async function deleteImages({ db, env }: Ctx, ids: number[]) {
  if (ids.length === 0) return
  const rows = await db.delete(images).where(inArray(images.id, ids)).returning()
  await env.images.delete(rows.map((img) => img.key))
}
