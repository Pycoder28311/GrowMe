import type { Plant, PlantCreate, PlantFilter, PlantSummary, PlantUpdate } from '@growme/shared'
import { and, asc, desc, eq } from 'drizzle-orm'
import { combinations, diseases, lifecycles, plantImages, plants, plantTips } from '../../db/schema'
import { hasChanges, type Ctx, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { assertExists, removedIds, replaceLinks, runBatch, type LinkTable } from '../../lib/relations'
import { assertCanLinkImages, deleteImages, toImageRefs } from '../images/images.repo'
import { toCombination } from '../combinations/combinations.repo'
import { toDisease } from '../diseases/diseases.repo'
import { toLifecycle } from '../lifecycles/lifecycles.repo'
import { toTip } from '../tips/tips.repo'
import { toColumns, toFilterFields } from './plants.columns'

export const plantImageLinks: LinkTable<typeof plantImages> = {
  table: plantImages,
  parent: plantImages.plantId,
  toRow: (plantId, imageId, position) => ({ plantId, imageId, position }),
}

const withImages = { images: { orderBy: asc(plantImages.position), with: { image: true } } } as const

/** Everything shown on a plant's page, loaded in one query */
const withDetails = {
  ...withImages,
  combination: true,
  lifecycles: { orderBy: (l: typeof lifecycles._.columns) => [asc(l.position), asc(l.id)] },
  tipLinks: { orderBy: asc(plantTips.position), with: { tip: true } },
  diseases: { orderBy: asc(diseases.id) },
} as const

const find = (ctx: Ctx, id: number) =>
  ctx.db.query.plants.findFirst({ where: eq(plants.id, id), with: withDetails })

type SummaryRow = typeof plants.$inferSelect & { images: { image: { id: number; key: string } }[] }
type DetailRow = NonNullable<Awaited<ReturnType<typeof find>>>

const toSummary = (env: CloudflareBindings, p: SummaryRow): PlantSummary => ({
  id: p.id,
  combinationId: p.combinationId,
  name: p.name,
  scientificName: p.scientificName,
  description: p.description,
  native: p.native,
  lifespan: p.lifespan,
  ...toFilterFields(p),
  images: toImageRefs(env, p.images),
  createdAt: p.createdAt.toISOString(),
})

const toJson = (env: CloudflareBindings, p: DetailRow): Plant => ({
  ...toSummary(env, p),
  combination: p.combination ? toCombination(p.combination) : null,
  lifecycles: p.lifecycles.map(toLifecycle),
  tips: p.tipLinks.map((l) => toTip(l.tip)),
  diseases: p.diseases.map(toDisease),
})

const assertCombination = (ctx: Ctx, id: number | null | undefined) =>
  id ? assertExists(ctx.db, combinations, combinations.id, id, 'combinationId') : undefined

/** Public read; admins write. Lists are light (PlantSummary); GET /:id has everything (Plant). */
export const plantsRepo: Repo<PlantCreate, PlantUpdate, Plant, PlantFilter, PlantSummary> = {
  async list(ctx, page, { combinationId }) {
    const rows = await ctx.db.query.plants.findMany({
      where: and(combinationId ? eq(plants.combinationId, combinationId) : undefined, beforeCursor(plants.id, page)),
      orderBy: desc(plants.id),
      limit: fetchLimit(page),
      with: withImages,
    })
    return mapPage(
      toPage(rows, page, (p) => p.id),
      (p) => toSummary(ctx.env, p),
    )
  },

  async get(ctx, id) {
    const plant = await find(ctx, id)
    return plant ? toJson(ctx.env, plant) : null
  },

  async create(ctx, { imageIds, ...fields }) {
    await assertCombination(ctx, fields.combinationId)
    await assertCanLinkImages(ctx, imageIds)
    const { id } = await ctx.db.insert(plants).values(toColumns(fields)).returning().get()
    await runBatch(ctx.db, [...replaceLinks(ctx.db, plantImageLinks, id, imageIds)])
    return toJson(ctx.env, (await find(ctx, id))!)
  },

  async update(ctx, id, { imageIds, ...fields }) {
    const existing = await ctx.db.query.plants.findFirst({ where: eq(plants.id, id), with: withImages })
    if (!existing) return null
    await assertCombination(ctx, fields.combinationId)
    const before = existing.images.map((l) => l.imageId)
    if (imageIds) await assertCanLinkImages(ctx, imageIds, before)

    await runBatch(ctx.db, [
      ...(hasChanges(fields) ? [ctx.db.update(plants).set(toColumns(fields)).where(eq(plants.id, id))] : []),
      ...(imageIds ? replaceLinks(ctx.db, plantImageLinks, id, imageIds) : []),
    ])
    if (imageIds) await deleteImages(ctx, removedIds(before, imageIds))
    return toJson(ctx.env, (await find(ctx, id))!)
  },

  async remove(ctx, id) {
    const existing = await ctx.db.query.plants.findFirst({ where: eq(plants.id, id), with: withImages })
    if (!existing) return false
    await ctx.db.delete(plants).where(eq(plants.id, id)) // lifecycles, diseases, tip and image links cascade
    await deleteImages(
      ctx,
      existing.images.map((l) => l.imageId),
    )
    return true
  },
}
