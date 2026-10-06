import type { Tip, TipCreate, TipSummary, TipUpdate } from '@growme/shared'
import { desc, eq, sql } from 'drizzle-orm'
import { tips } from '../../db/schema'
import { hasChanges, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'

export const toTip = (t: typeof tips.$inferSelect): Tip => ({
  id: t.id,
  title: t.title,
  content: t.content,
})

/**
 * How many plants show the tip (counted, never stored). Table names are written out: in a one-table
 * select drizzle prints a bare "id", which inside the subquery would mean another table's id.
 */
const plantCount = sql<number>`(SELECT count(*) FROM plant_tips pt WHERE pt.tip_id = "tips"."id")`

/** The tips library, newest first; admins write. Deleting a tip takes it off every plant (links cascade). */
export const tipsRepo: Repo<TipCreate, TipUpdate, Tip, unknown, TipSummary> = {
  async list(ctx, page) {
    const rows = await ctx.db
      .select({ tip: tips, plantCount })
      .from(tips)
      .where(beforeCursor(tips.id, page))
      .orderBy(desc(tips.id))
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (r) => r.tip.id),
      (r): TipSummary => ({ ...toTip(r.tip), plantCount: r.plantCount }),
    )
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(tips).where(eq(tips.id, id)).get()
    return row ? toTip(row) : null
  },
  async create(ctx, input) {
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
