import { blogLinkIds, richBlogLinkIds, type PlantSave } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import type { Db } from '../../../db'
import { combinations, diseases, lifecycles, plantImages, plants } from '../../../db/schema'
import {
  assertExists,
  assertOwnChildren,
  removedIds,
  replaceLinks,
  runBatch,
  syncChildren,
  type ChildTable,
} from '../../../lib/relations'
import { assertBlogLinks } from '../../blogs/blog-links'
import { assertAdminImages, deleteImages } from '../../images/images.repo'
import { plantImageLinks } from '../../plants/plants.repo'
import { toColumns } from '../../plants/plants.columns'

type Rows<K extends 'lifecycles' | 'diseases'> = PlantSave[K][number]

const lifecycleRows: ChildTable<typeof lifecycles, Rows<'lifecycles'>> = {
  table: lifecycles,
  id: lifecycles.id,
  parent: lifecycles.plantId,
  toRow: (plantId, { title, content, tab, duration }, position) => ({ plantId, position, title, content, tab, duration }),
}

const diseaseRows: ChildTable<typeof diseases, Rows<'diseases'>> = {
  table: diseases,
  id: diseases.id,
  parent: diseases.plantId,
  // The texts are the editor's documents, stored as JSON text (like an article's); empty = null
  toRow: (plantId, { title, label, symptoms, what, action }) => ({
    plantId,
    title,
    label,
    symptoms: symptoms ? JSON.stringify(symptoms) : null,
    what: what ? JSON.stringify(what) : null,
    action: action ? JSON.stringify(action) : null,
  }),
}

/** The batch that writes everything except the plant's own row */
const childStatements = (
  db: Db,
  plantId: number,
  input: PlantSave,
  stored: { lifecycles: { id: number }[]; diseases: { id: number }[] } = { lifecycles: [], diseases: [] },
) => [
  ...syncChildren(db, lifecycleRows, plantId, input.lifecycles, stored.lifecycles),
  ...syncChildren(db, diseaseRows, plantId, input.diseases, stored.diseases),
  ...replaceLinks(db, plantImageLinks, plantId, input.imageIds),
]

/** Every text of the form that may link to blogs, with its path for errors */
const linkFields = (input: PlantSave) => [
  { path: 'description', ids: input.description ? richBlogLinkIds(input.description) : [] },
  { path: 'native', ids: blogLinkIds(input.native) },
  ...input.lifecycles.map((row, i) => ({ path: `lifecycles.${i}.content`, ids: blogLinkIds(row.content) })),
  ...input.diseases.flatMap((row, i) =>
    (['symptoms', 'what', 'action'] as const).map((field) => ({
      path: `diseases.${i}.${field}`,
      ids: row[field] ? richBlogLinkIds(row[field]) : [],
    })),
  ),
]

/**
 * Creates (id null) or replaces a plant with its lifecycles, diseases and photos, as the
 * dashboard's form sends them. Returns null when the plant to update doesn't exist.
 */
export async function savePlant(
  { db, env }: { db: Db; env: CloudflareBindings },
  id: number | null,
  input: PlantSave,
): Promise<{ id: number } | null> {
  const { lifecycles: _lifecycles, diseases: _diseases, imageIds, ...rest } = input
  // The description is the editor's document, stored as JSON text (null when empty)
  const fields = toColumns({ ...rest, description: rest.description ? JSON.stringify(rest.description) : null })
  if (fields.combinationId) {
    await assertExists(db, combinations, combinations.id, fields.combinationId, 'combinationId')
  }
  await assertBlogLinks(db, linkFields(input))

  if (id === null) {
    await assertAdminImages(db, imageIds)
    const { id: newId } = await db.insert(plants).values(fields).returning({ id: plants.id }).get()
    try {
      await runBatch(db, childStatements(db, newId, input))
    } catch (err) {
      await db.delete(plants).where(eq(plants.id, newId)) // no half-saved plant
      throw err
    }
    return { id: newId }
  }

  const existing = await db.query.plants.findFirst({
    where: eq(plants.id, id),
    columns: { id: true },
    with: {
      images: { columns: { imageId: true }, orderBy: asc(plantImages.position) },
      lifecycles: true, // whole rows: unchanged ones are not written again
      diseases: true,
    },
  })
  if (!existing) return null

  const before = existing.images.map((l) => l.imageId)
  await assertAdminImages(db, imageIds, before)
  assertOwnChildren('lifecycles', input.lifecycles, existing.lifecycles.map((r) => r.id))
  assertOwnChildren('diseases', input.diseases, existing.diseases.map((r) => r.id))

  await runBatch(db, [db.update(plants).set(fields).where(eq(plants.id, id)), ...childStatements(db, id, input, existing)])
  await deleteImages({ db, env }, removedIds(before, imageIds))
  return { id }
}
