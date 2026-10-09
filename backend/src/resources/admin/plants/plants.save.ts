import { blogLinkIds, type PlantSave } from '@growme/shared'
import { and, asc, eq, inArray, notExists } from 'drizzle-orm'
import type { Db } from '../../../db'
import { combinations, diseases, lifecycles, plantImages, plants, plantTips, tips } from '../../../db/schema'
import { HttpError } from '../../../lib/errors'
import {
  assertExists,
  assertOwnChildren,
  removedIds,
  replaceLinks,
  runBatch,
  syncChildren,
  type ChildTable,
  type LinkTable,
} from '../../../lib/relations'
import { assertBlogLinks } from '../../blogs/blog-links'
import { assertAdminImages, deleteImages } from '../../images/images.repo'
import { plantImageLinks } from '../../plants/plants.repo'
import { toColumns } from '../../plants/plants.columns'

type Rows<K extends 'lifecycles' | 'diseases'> = PlantSave[K][number]
type TipRow = PlantSave['tips'][number]

const lifecycleRows: ChildTable<typeof lifecycles, Rows<'lifecycles'>> = {
  table: lifecycles,
  id: lifecycles.id,
  parent: lifecycles.plantId,
  toRow: (plantId, { title, content, seed, duration }, position) => ({ plantId, position, title, content, seed, duration }),
}

const plantTipLinks: LinkTable<typeof plantTips> = {
  table: plantTips,
  parent: plantTips.plantId,
  toRow: (plantId, tipId, position) => ({ plantId, tipId, position }),
}

const diseaseRows: ChildTable<typeof diseases, Rows<'diseases'>> = {
  table: diseases,
  id: diseases.id,
  parent: diseases.plantId,
  toRow: (plantId, { title, label, content }) => ({ plantId, title, label, content }),
}

/** Throws 400 UNKNOWN_REFERENCE at "tips.<i>.tipId" for picked tips that aren't in the library */
async function assertTipsExist(db: Db, rows: TipRow[]) {
  const picked = rows.flatMap((row) => ('tipId' in row ? [row.tipId] : []))
  if (picked.length === 0) return
  const found = new Set(
    (await db.select({ id: tips.id }).from(tips).where(inArray(tips.id, picked))).map((r) => r.id),
  )
  const details = rows.flatMap((row, i) =>
    'tipId' in row && !found.has(row.tipId) ? [{ path: `tips.${i}.tipId`, message: 'Not found' }] : [],
  )
  if (details.length > 0) throw new HttpError(400, 'UNKNOWN_REFERENCE', 'Unknown tipId', details)
}

/** Adds the form's new tips to the library; returns every row's tip id, in the form's order */
async function createNewTips(db: Db, rows: TipRow[]) {
  const fresh = rows.flatMap((row) => ('tipId' in row ? [] : [row]))
  const created: number[] = []
  if (fresh.length > 0) {
    const inserts = fresh.map((row) => db.insert(tips).values(row).returning({ id: tips.id }))
    const results = await db.batch(inserts as [(typeof inserts)[number], ...typeof inserts])
    created.push(...results.map(([row]) => row.id))
  }
  let next = 0
  const ordered = rows.map((row) => ('tipId' in row ? row.tipId : created[next++]))
  return { ordered, created }
}

/** Tips taken off this plant that no other plant shows any more: they leave the library (D3) */
const deleteOrphanTips = (db: Db, removed: number[]) =>
  removed.length === 0
    ? []
    : [
        db
          .delete(tips)
          .where(
            and(
              inArray(tips.id, removed),
              notExists(db.select({ one: plantTips.tipId }).from(plantTips).where(eq(plantTips.tipId, tips.id))),
            ),
          ),
      ]

/** The batch that writes everything except the plant's own row (tipIds: the tips in order) */
const childStatements = (db: Db, plantId: number, input: PlantSave, tipIds: number[], removedTips: number[]) => [
  ...syncChildren(db, lifecycleRows, plantId, input.lifecycles),
  ...syncChildren(db, diseaseRows, plantId, input.diseases),
  ...replaceLinks(db, plantTipLinks, plantId, tipIds),
  ...deleteOrphanTips(db, removedTips),
  ...replaceLinks(db, plantImageLinks, plantId, input.imageIds),
]

/** Every text of the form that may link to blogs, with its path for errors */
const linkFields = (input: PlantSave) => [
  ...(['description', 'native'] as const).map((key) => ({ path: key, ids: blogLinkIds(input[key]) })),
  ...input.lifecycles.map((row, i) => ({ path: `lifecycles.${i}.content`, ids: blogLinkIds(row.content) })),
  ...input.tips.map((row, i) => ({ path: `tips.${i}.content`, ids: 'tipId' in row ? [] : blogLinkIds(row.content) })),
  ...input.diseases.map((row, i) => ({ path: `diseases.${i}.content`, ids: blogLinkIds(row.content) })),
]

/** Removes the tips created for a save that then failed (no stray library entries) */
const forgetTips = (db: Db, created: number[]) =>
  created.length > 0 ? db.delete(tips).where(inArray(tips.id, created)) : Promise.resolve()

/**
 * Creates (id null) or replaces a plant with its lifecycles, tips, diseases and photos, as the
 * dashboard's form sends them. Tips are picked from the library or written new (added to it); a tip
 * taken off its last plant is deleted. Returns null when the plant to update doesn't exist.
 */
export async function savePlant(
  { db, env }: { db: Db; env: CloudflareBindings },
  id: number | null,
  input: PlantSave,
): Promise<{ id: number } | null> {
  const { lifecycles: _lifecycles, tips: _tips, diseases: _diseases, imageIds, ...rest } = input
  const fields = toColumns(rest)
  if (fields.combinationId) {
    await assertExists(db, combinations, combinations.id, fields.combinationId, 'combinationId')
  }
  await assertTipsExist(db, input.tips)
  await assertBlogLinks(db, linkFields(input))

  if (id === null) {
    await assertAdminImages(db, imageIds)
    const { id: newId } = await db.insert(plants).values(fields).returning({ id: plants.id }).get()
    let created: number[] = []
    try {
      const tipIds = await createNewTips(db, input.tips)
      created = tipIds.created
      await runBatch(db, childStatements(db, newId, input, tipIds.ordered, []))
    } catch (err) {
      await db.delete(plants).where(eq(plants.id, newId)) // no half-saved plant
      await forgetTips(db, created)
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
      tipLinks: { columns: { tipId: true } },
      diseases: { columns: { id: true } },
    },
  })
  if (!existing) return null

  const before = existing.images.map((l) => l.imageId)
  await assertAdminImages(db, imageIds, before)
  assertOwnChildren('lifecycles', input.lifecycles, existing.lifecycles.map((r) => r.id))
  assertOwnChildren('diseases', input.diseases, existing.diseases.map((r) => r.id))

  const tipIds = await createNewTips(db, input.tips)
  const removedTips = removedIds(
    existing.tipLinks.map((l) => l.tipId),
    tipIds.ordered,
  )
  try {
    await runBatch(db, [
      db.update(plants).set(fields).where(eq(plants.id, id)),
      ...childStatements(db, id, input, tipIds.ordered, removedTips),
    ])
  } catch (err) {
    await forgetTips(db, tipIds.created)
    throw err
  }
  await deleteImages({ db, env }, removedIds(before, imageIds))
  return { id }
}
