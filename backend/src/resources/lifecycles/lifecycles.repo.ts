import type { Lifecycle, LifecycleCreate, LifecycleUpdate, PlantChildFilter } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { lifecycles, plants } from '../../db/schema'
import { hasChanges, type Repo } from '../../lib/crud'
import { assertExists } from '../../lib/relations'

export const toLifecycle = (l: typeof lifecycles.$inferSelect): Lifecycle => ({
  id: l.id,
  plantId: l.plantId,
  title: l.title,
  content: l.content,
})

/** The lifecycle stages of one plant (?plantId=), in order; admins write */
export const lifecyclesRepo: Repo<LifecycleCreate, LifecycleUpdate, Lifecycle, PlantChildFilter> = {
  async list(ctx, _page, { plantId }) {
    const rows = await ctx.db.select().from(lifecycles).where(eq(lifecycles.plantId, plantId)).orderBy(asc(lifecycles.id))
    return { items: rows.map(toLifecycle), nextCursor: null }
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(lifecycles).where(eq(lifecycles.id, id)).get()
    return row ? toLifecycle(row) : null
  },
  async create(ctx, input) {
    await assertExists(ctx.db, plants, plants.id, input.plantId, 'plantId')
    return toLifecycle(await ctx.db.insert(lifecycles).values(input).returning().get())
  },
  async update(ctx, id, input) {
    if (!hasChanges(input)) return this.get(ctx, id)
    const row = await ctx.db.update(lifecycles).set(input).where(eq(lifecycles.id, id)).returning().get()
    return row ? toLifecycle(row) : null
  },
  async remove(ctx, id) {
    return !!(await ctx.db.delete(lifecycles).where(eq(lifecycles.id, id)).returning().get())
  },
}
