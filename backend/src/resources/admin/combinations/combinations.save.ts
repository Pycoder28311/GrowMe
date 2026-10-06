import type { CombinationSave } from '@growme/shared'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import type { Db } from '../../../db'
import { combinations, plants } from '../../../db/schema'
import type { Store } from '../../../lib/crud'
import { HttpError } from '../../../lib/errors'
import { runBatch } from '../../../lib/relations'

/** Throws 400 UNKNOWN_REFERENCE at "plantIds.<i>" for plants that don't exist */
async function assertPlantsExist(db: Db, plantIds: number[]) {
  if (plantIds.length === 0) return
  const found = new Set(
    (await db.select({ id: plants.id }).from(plants).where(inArray(plants.id, plantIds))).map((p) => p.id),
  )
  const details = plantIds.flatMap((id, i) => (found.has(id) ? [] : [{ path: `plantIds.${i}`, message: 'Not found' }]))
  if (details.length > 0) throw new HttpError(400, 'UNKNOWN_REFERENCE', 'Unknown plantIds', details)
}

/** The plants of a combination become exactly `plantIds`: others leave it, picked ones move into it */
const plantStatements = (db: Db, combinationId: number, plantIds: number[]) => [
  db
    .update(plants)
    .set({ combinationId: null })
    .where(
      plantIds.length > 0
        ? and(eq(plants.combinationId, combinationId), notInArray(plants.id, plantIds))
        : eq(plants.combinationId, combinationId),
    ),
  ...(plantIds.length > 0
    ? [db.update(plants).set({ combinationId }).where(inArray(plants.id, plantIds))]
    : []),
]

/**
 * Creates (id null) or replaces a combination with its plants, as the dashboard's form sends it.
 * A plant is in one combination at most: picking one from another combination moves it here.
 * Returns null when the combination to update doesn't exist.
 */
export async function saveCombination({ db }: Store, id: number | null, { plantIds, ...fields }: CombinationSave) {
  await assertPlantsExist(db, plantIds)

  if (id === null) {
    const { id: newId } = await db.insert(combinations).values(fields).returning({ id: combinations.id }).get()
    try {
      await runBatch(db, plantStatements(db, newId, plantIds))
    } catch (err) {
      await db.delete(combinations).where(eq(combinations.id, newId)) // no half-saved combination
      throw err
    }
    return { id: newId }
  }

  const existing = await db.select({ id: combinations.id }).from(combinations).where(eq(combinations.id, id)).get()
  if (!existing) return null
  await runBatch(db, [
    db.update(combinations).set(fields).where(eq(combinations.id, id)),
    ...plantStatements(db, id, plantIds),
  ])
  return { id }
}
