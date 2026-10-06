import type { PlantSave } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import type { Db } from '../../../db'
import { combinations, diseases, lifecycles, plantImages, plants, tips } from '../../../db/schema'
import {
  assertExists,
  assertOwnChildren,
  removedIds,
  replaceLinks,
  runBatch,
  syncChildren,
  type ChildTable,
} from '../../../lib/relations'
import { assertAdminImages, deleteImages } from '../../images/images.repo'
import { plantImageLinks } from '../../plants/plants.repo'

type Rows<K extends 'lifecycles' | 'tips' | 'diseases'> = PlantSave[K][number]

const lifecycleRows: ChildTable<typeof lifecycles, Rows<'lifecycles'>> = {
  table: lifecycles,
  id: lifecycles.id,
  parent: lifecycles.plantId,
  toRow: (plantId, { title, content }, position) => ({ plantId, position, title, content }),
}

const tipRows: ChildTable<typeof tips, Rows<'tips'>> = {
  table: tips,
  id: tips.id,
  parent: tips.plantId,
  toRow: (plantId, { title, content }, position) => ({ plantId, position, title, content }),
}

const diseaseRows: ChildTable<typeof diseases, Rows<'diseases'>> = {
  table: diseases,
  id: diseases.id,
  parent: diseases.plantId,
  toRow: (plantId, { title, label, content }) => ({ plantId, title, label, content }),
}

/** The batch that writes everything except the plant's own row */
const childStatements = (db: Db, plantId: number, input: PlantSave) => [
  ...syncChildren(db, lifecycleRows, plantId, input.lifecycles),
  ...syncChildren(db, tipRows, plantId, input.tips),
  ...syncChildren(db, diseaseRows, plantId, input.diseases),
  ...replaceLinks(db, plantImageLinks, plantId, input.imageIds),
]

/**
 * Creates (id null) or replaces a plant with its lifecycles, tips, diseases and photos, as the
 * dashboard's form sends them. Returns null when the plant to update doesn't exist.
 */
export async function savePlant(
  { db, env }: { db: Db; env: CloudflareBindings },
  id: number | null,
  input: PlantSave,
): Promise<{ id: number } | null> {
  const { lifecycles: _lifecycles, tips: _tips, diseases: _diseases, imageIds, ...fields } = input
  if (fields.combinationId) {
    await assertExists(db, combinations, combinations.id, fields.combinationId, 'combinationId')
  }

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
      lifecycles: { columns: { id: true } },
      tips: { columns: { id: true } },
      diseases: { columns: { id: true } },
    },
  })
  if (!existing) return null

  const before = existing.images.map((l) => l.imageId)
  await assertAdminImages(db, imageIds, before)
  assertOwnChildren('lifecycles', input.lifecycles, existing.lifecycles.map((r) => r.id))
  assertOwnChildren('tips', input.tips, existing.tips.map((r) => r.id))
  assertOwnChildren('diseases', input.diseases, existing.diseases.map((r) => r.id))

  await runBatch(db, [db.update(plants).set(fields).where(eq(plants.id, id)), ...childStatements(db, id, input)])
  await deleteImages({ db, env }, removedIds(before, imageIds))
  return { id }
}
