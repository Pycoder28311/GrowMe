import { Hono } from 'hono'
import { getDb } from '../db'
import { images } from '../db/schema'
import { requireAuth, type AppEnv } from '../middleware/auth'

const MAX_FILES = 10
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const imagesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = [body.files].flat().filter((f): f is File => f instanceof File)

    if (files.length === 0) return c.json({ error: 'No files uploaded' }, 400)
    if (files.length > MAX_FILES) return c.json({ error: `Max ${MAX_FILES} files` }, 400)
    for (const file of files) {
      if (!EXTENSIONS[file.type]) return c.json({ error: 'Only JPEG, PNG or WebP images' }, 415)
      if (file.size > MAX_SIZE) return c.json({ error: 'Each image must be under 10 MB' }, 413)
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const key = `img/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
        await c.env.images.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000, immutable',
          },
        })
        return { key, contentType: file.type, size: file.size, userId: c.get('user').id }
      }),
    )

    const rows = await getDb(c.env).insert(images).values(uploaded).returning()
    return c.json(
      rows.map((img) => ({ id: img.id, url: `${c.env.IMAGES_URL}/${img.key}` })),
      201,
    )
  })

export default imagesRoutes
