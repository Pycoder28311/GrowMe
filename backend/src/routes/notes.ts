import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, type Db } from '../db'
import { images, noteImages, notes } from '../db/schema'

const idParam = z.object({ id: z.coerce.number().int().positive() })
const noteBody = z.object({
  text: z.string().trim().min(1).max(1000),
  imageIds: z.array(z.number().int().positive()).max(10).default([]),
})

const withImages = {
  images: {
    orderBy: asc(noteImages.position),
    with: { image: true },
  },
} as const

type NoteWithImages = NonNullable<Awaited<ReturnType<typeof findNote>>>

const findNote = (db: Db, id: number) =>
  db.query.notes.findFirst({ where: eq(notes.id, id), with: withImages })

const toJson = (note: NoteWithImages, imagesUrl: string) => ({
  id: note.id,
  text: note.text,
  images: note.images.map(({ image }) => ({ id: image.id, url: `${imagesUrl}/${image.key}` })),
})

// Deletes image rows (links cascade) and their files in R2
async function deleteImages(db: Db, bucket: R2Bucket, ids: number[]) {
  if (ids.length === 0) return
  const rows = await db.delete(images).where(inArray(images.id, ids)).returning()
  await bucket.delete(rows.map((img) => img.key))
}

async function allImagesExist(db: Db, ids: number[]) {
  if (ids.length === 0) return true
  const rows = await db.select({ id: images.id }).from(images).where(inArray(images.id, ids))
  return rows.length === new Set(ids).size
}

const links = (noteId: number, imageIds: number[]) =>
  imageIds.map((imageId, position) => ({ noteId, imageId, position }))

const notesRoutes = new Hono<{ Bindings: CloudflareBindings }>()
  // List all notes with their images, newest first
  .get('/', async (c) => {
    const rows = await getDb(c.env).query.notes.findMany({
      orderBy: desc(notes.id),
      with: withImages,
    })
    return c.json(rows.map((note) => toJson(note, c.env.IMAGES_URL)))
  })

  // Read one note
  .get('/:id', zValidator('param', idParam), async (c) => {
    const note = await findNote(getDb(c.env), c.req.valid('param').id)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json(toJson(note, c.env.IMAGES_URL))
  })

  // Create a note with its (already uploaded) images
  .post('/', zValidator('json', noteBody), async (c) => {
    const { text, imageIds } = c.req.valid('json')
    const db = getDb(c.env)
    if (!(await allImagesExist(db, imageIds))) return c.json({ error: 'Unknown image' }, 400)

    const { id } = await db.insert(notes).values({ text }).returning().get()
    if (imageIds.length) await db.insert(noteImages).values(links(id, imageIds))

    return c.json(toJson((await findNote(db, id))!, c.env.IMAGES_URL), 201)
  })

  // Edit a note: replaces its text and its ordered list of images
  .patch('/:id', zValidator('param', idParam), zValidator('json', noteBody), async (c) => {
    const { id } = c.req.valid('param')
    const { text, imageIds } = c.req.valid('json')
    const db = getDb(c.env)

    const existing = await findNote(db, id)
    if (!existing) return c.json({ error: 'Note not found' }, 404)
    if (!(await allImagesExist(db, imageIds))) return c.json({ error: 'Unknown image' }, 400)

    await db.batch([
      db.update(notes).set({ text }).where(eq(notes.id, id)),
      db.delete(noteImages).where(eq(noteImages.noteId, id)),
      ...(imageIds.length ? [db.insert(noteImages).values(links(id, imageIds))] : []),
    ])

    const removed = existing.images.map((l) => l.imageId).filter((i) => !imageIds.includes(i))
    await deleteImages(db, c.env.images, removed)

    return c.json(toJson((await findNote(db, id))!, c.env.IMAGES_URL))
  })

  // Delete a note and its images
  .delete('/:id', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const db = getDb(c.env)

    const existing = await findNote(db, id)
    if (!existing) return c.json({ error: 'Note not found' }, 404)

    await db.delete(notes).where(eq(notes.id, id))
    await deleteImages(db, c.env.images, existing.images.map((l) => l.imageId))

    return c.body(null, 204)
  })

export default notesRoutes
