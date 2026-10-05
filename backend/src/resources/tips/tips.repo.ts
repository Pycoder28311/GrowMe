import type { PlantChildFilter, Tip, TipCreate, TipUpdate } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { plants, tips } from '../../db/schema'
import { hasChanges, type Repo } from '../../lib/crud'
import { assertExists } from '../../lib/relations'

export const toTip = (t: typeof tips.$inferSelect): Tip => ({
  id: t.id,
  plantId: t.plantId,
  position: t.position,
  title: t.title,
  content: t.content,
})

/** The tips of one plant (?plantId=), by position; admins write */
export const tipsRepo: Repo<TipCreate, TipUpdate, Tip, PlantChildFilter> = {
  async list(ctx, _page, { plantId }) {
    const rows = await ctx.db
      .select()
      .from(tips)
      .where(eq(tips.plantId, plantId))
      .orderBy(asc(tips.position), asc(tips.id))
    return { items: rows.map(toTip), nextCursor: null }
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(tips).where(eq(tips.id, id)).get()
    return row ? toTip(row) : null
  },
  async create(ctx, input) {
    await assertExists(ctx.db, plants, plants.id, input.plantId, 'plantId')
    return toTip(await ctx.db.insert(tips).values(input).returning().get())
  },
  async update(ctx, id, input) {
    if (!hasChanges(input)) return this.get(ctx, id)
    const row = await ctx.db.update(tips).set(input).where(eq(tips.id, id)).returning().get()
    return row ? toTip(row) : null
  },
  async remove(ctx, id) {
    return !!(await ctx.db.delete(tips).where(eq(tips.id, id)).returning().get())
  },
}
