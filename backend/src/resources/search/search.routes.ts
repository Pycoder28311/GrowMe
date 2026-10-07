import type { SearchIndex } from '@growme/shared'
import { asc } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../../db'
import { blogImages, blogs, plantImages, plants } from '../../db/schema'
import type { AppEnv } from '../../middleware/auth'
import { imageUrl } from '../images/images.repo'

/**
 * GET / → SearchIndex: every plant (name, scientific name) and blog (title, kind), each with its
 * first cover. Public and small (a few hundred bytes per item): the app loads it once and filters
 * on the phone, so typing never waits for the network. Cached for 5 minutes.
 */
const searchRoutes = new Hono<AppEnv>().get('/', async (c) => {
  const db = getDb(c.env)
  const firstImage = { orderBy: asc(plantImages.position), limit: 1, with: { image: { columns: { key: true } } } } as const
  const [plantRows, blogRows] = await Promise.all([
    db.query.plants.findMany({
      columns: { id: true, name: true, scientificName: true },
      orderBy: asc(plants.name),
      with: { images: firstImage },
    }),
    db.query.blogs.findMany({
      columns: { id: true, name: true, kind: true },
      orderBy: asc(blogs.name),
      with: { images: { orderBy: asc(blogImages.position), limit: 1, with: { image: { columns: { key: true } } } } },
    }),
  ])
  const cover = (links: { image: { key: string } }[]) => (links[0] ? imageUrl(c.env, links[0].image.key) : null)
  const index: SearchIndex = {
    plants: plantRows.map((p) => ({ id: p.id, name: p.name, scientificName: p.scientificName, image: cover(p.images) })),
    blogs: blogRows.map((b) => ({ id: b.id, name: b.name, kind: b.kind, image: cover(b.images) })),
  }
  c.header('Cache-Control', 'public, max-age=300')
  return c.json(index)
})

export default searchRoutes
