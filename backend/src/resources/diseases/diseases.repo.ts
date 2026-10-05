import type { Disease, DiseaseCreate, DiseaseUpdate, PlantChildFilter } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { diseases, plants } from '../../db/schema'
import { hasChanges, type Repo } from '../../lib/crud'
import { assertExists } from '../../lib/relations'

export const toDisease = (d: typeof diseases.$inferSelect): Disease => ({
  id: d.id,
  plantId: d.plantId,
  title: d.title,
  label: d.label,
  content: d.content,
})

/** The diseases of one plant (?plantId=); admins write */
export const diseasesRepo: Repo<DiseaseCreate, DiseaseUpdate, Disease, PlantChildFilter> = {
  async list(ctx, _page, { plantId }) {
    const rows = await ctx.db.select().from(diseases).where(eq(diseases.plantId, plantId)).orderBy(asc(diseases.id))
    return { items: rows.map(toDisease), nextCursor: null }
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(diseases).where(eq(diseases.id, id)).get()
    return row ? toDisease(row) : null
  },
  async create(ctx, input) {
    await assertExists(ctx.db, plants, plants.id, input.plantId, 'plantId')
    return toDisease(await ctx.db.insert(diseases).values(input).returning().get())
  },
  async update(ctx, id, input) {
    if (!hasChanges(input)) return this.get(ctx, id)
    const row = await ctx.db.update(diseases).set(input).where(eq(diseases.id, id)).returning().get()
    return row ? toDisease(row) : null
  },
  async remove(ctx, id) {
    return !!(await ctx.db.delete(diseases).where(eq(diseases.id, id)).returning().get())
  },
}
