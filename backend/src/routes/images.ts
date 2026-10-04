import { Hono } from 'hono'
import { getDb } from '../db'
import { images } from '../db/schema'
import { detectImageType, type ImageType } from '../lib/image-type'
import { requireAuth, type AppEnv } from '../middleware/auth'

const MAX_FILES = 10
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const EXTENSIONS: Record<ImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const imagesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  // Upload one or more images in a single request (multipart field "files")
  .post('/', async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = [body.files].flat().filter((f): f is File => f instanceof File)

    if (files.length === 0) return c.json({ error: 'No files uploaded' }, 400)
    if (files.length > MAX_FILES) return c.json({ error: `Max ${MAX_FILES} files` }, 400)

    // Check every file before storing anything: size first, then its real type from its bytes
    const checked: { file: File; type: ImageType }[] = []
    for (const file of files) {
      if (file.size > MAX_SIZE) return c.json({ error: 'Each image must be under 10 MB' }, 413)
      const type = await detectImageType(file)
      if (!type) return c.json({ error: 'Only JPEG, PNG or WebP images' }, 415)
      checked.push({ file, type })
    }

    const userId = c.get('user').id
    const uploaded = await Promise.all(
      checked.map(async ({ file, type }) => {
        const key = `img/${crypto.randomUUID()}.${EXTENSIONS[type]}`
        await c.env.images.put(key, file.stream(), {
          httpMetadata: {
            contentType: type, // the real type, not what the client claimed
            cacheControl: 'public, max-age=31536000, immutable',
          },
        })
        return { key, contentType: type, size: file.size, userId }
      }),
    )

    const rows = await getDb(c.env).insert(images).values(uploaded).returning()
    return c.json(
      rows.map((img) => ({ id: img.id, url: `${c.env.IMAGES_URL}/${img.key}` })),
      201,
    )
  })

export default imagesRoutes
