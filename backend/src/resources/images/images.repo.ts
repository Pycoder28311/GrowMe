import type { ImageRef } from '@growme/shared'
import { and, inArray, isNull } from 'drizzle-orm'
import { getDb, type Db } from '../../db'
import { images } from '../../db/schema'
import { userId, type Ctx } from '../../lib/crud'
import { HttpError } from '../../lib/errors'
import { detectImageType, type ImageType } from '../../lib/image-type'
import { ownsAll } from '../../lib/relations'

const MAX_FILES = 10
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const EXTENSIONS: Record<ImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Public URL for a stored image key */
export const imageUrl = (env: CloudflareBindings, key: string) => `${env.IMAGES_URL}/${key}`

/** Linked images (loaded with `with: { images: { with: { image: true } } }`) as clients receive them */
export const toImageRefs = (env: CloudflareBindings, links: { image: { id: number; key: string } }[]): ImageRef[] =>
  links.map(({ image }) => ({ id: image.id, url: imageUrl(env, image.key) }))

/**
 * Throws 400 UNKNOWN_IMAGE unless every newly linked image was uploaded by the signed-in user.
 * Images already linked to the item stay allowed (e.g. another admin's photos on a plant).
 */
export async function assertCanLinkImages(ctx: Ctx, ids: number[], alreadyLinked: number[] = []) {
  const added = ids.filter((id) => !alreadyLinked.includes(id))
  if (!(await ownsAll(ctx.db, images, { id: images.id, owner: images.userId }, added, userId(ctx)))) {
    throw new HttpError(400, 'UNKNOWN_IMAGE', 'Unknown image')
  }
}

/**
 * Checks and stores uploaded files in R2 and the images table; answers [{ id, url }] in upload order.
 * ownerId null = uploaded by the admin (dashboard). Every file is checked before anything is stored.
 */
export async function storeImages(env: CloudflareBindings, files: File[], ownerId: string | null) {
  if (files.length === 0) throw new HttpError(400, 'NO_FILES', 'No files uploaded')
  if (files.length > MAX_FILES) throw new HttpError(400, 'TOO_MANY_FILES', `Max ${MAX_FILES} files`)

  // Size first, then the real type from the file's bytes
  const checked: { file: File; type: ImageType }[] = []
  for (const file of files) {
    if (file.size > MAX_SIZE) throw new HttpError(413, 'FILE_TOO_LARGE', 'Each image must be under 10 MB')
    const type = await detectImageType(file)
    if (!type) throw new HttpError(415, 'UNSUPPORTED_FILE_TYPE', 'Only JPEG, PNG or WebP images')
    checked.push({ file, type })
  }

  const uploaded = await Promise.all(
    checked.map(async ({ file, type }) => {
      const key = `img/${crypto.randomUUID()}.${EXTENSIONS[type]}`
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: type, // the real type, not what the client claimed
          cacheControl: 'public, max-age=31536000, immutable',
        },
      })
      return { key, contentType: type, size: file.size, userId: ownerId }
    }),
  )

  const rows = await getDb(env).insert(images).values(uploaded).returning()
  return rows.map((img) => ({ id: img.id, url: imageUrl(env, img.key) }))
}

/**
 * Throws 400 UNKNOWN_IMAGE unless every newly linked image was uploaded by the admin (no owner):
 * the dashboard can't link users' photos, and users can't link the admin's (their check needs their id).
 */
export async function assertAdminImages(db: Db, ids: number[], alreadyLinked: number[] = []) {
  const added = [...new Set(ids.filter((id) => !alreadyLinked.includes(id)))]
  if (added.length === 0) return
  const rows = await db
    .select({ id: images.id })
    .from(images)
    .where(and(inArray(images.id, added), isNull(images.userId)))
  if (rows.length !== added.length) throw new HttpError(400, 'UNKNOWN_IMAGE', 'Unknown image')
}

/** Deletes image rows (their links cascade) and the files in R2 */
export async function deleteImages({ db, env }: { db: Db; env: CloudflareBindings }, ids: number[]) {
  if (ids.length === 0) return
  const rows = await db.delete(images).where(inArray(images.id, ids)).returning()
  await env.BUCKET.delete(rows.map((img) => img.key))
}
