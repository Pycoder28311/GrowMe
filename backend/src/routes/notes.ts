import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { drizzle } from 'drizzle-orm/d1'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { notes } from '../db/schema'

const idParam = z.object({ id: z.coerce.number().int().positive() })
const noteBody = z.object({ text: z.string().trim().min(1).max(1000) })

const notesRoutes = new Hono<{ Bindings: CloudflareBindings }>()
  // List all notes, newest first
  .get('/', async (c) => {
    const db = drizzle(c.env.growme_db)
    const rows = await db.select().from(notes).orderBy(desc(notes.id))
    return c.json(rows)
  })

  // Read one note
  .get('/:id', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const db = drizzle(c.env.growme_db)
    const note = await db.select().from(notes).where(eq(notes.id, id)).get()
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json(note)
  })

  // Create a note
  .post('/', zValidator('json', noteBody), async (c) => {
    const { text } = c.req.valid('json')
    const db = drizzle(c.env.growme_db)
    const note = await db.insert(notes).values({ text }).returning().get()
    return c.json(note, 201)
  })

  // Edit a note
  .patch('/:id', zValidator('param', idParam), zValidator('json', noteBody), async (c) => {
    const { id } = c.req.valid('param')
    const { text } = c.req.valid('json')
    const db = drizzle(c.env.growme_db)
    const note = await db.update(notes).set({ text }).where(eq(notes.id, id)).returning().get()
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json(note)
  })

  // Delete a note
  .delete('/:id', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const db = drizzle(c.env.growme_db)
    const note = await db.delete(notes).where(eq(notes.id, id)).returning().get()
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.body(null, 204)
  })

export default notesRoutes
