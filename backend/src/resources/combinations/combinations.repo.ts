import type { Combination, CombinationCreate, CombinationUpdate } from '@growme/shared'
import { desc, eq } from 'drizzle-orm'
import { combinations } from '../../db/schema'
import { hasChanges, type Repo } from '../../lib/crud'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'

export const toCombination = (c: typeof combinations.$inferSelect): Combination => ({
  id: c.id,
  title: c.title,
  description: c.description,
})

/** Public read; admins write. Deleting one leaves its plants without a combination. */
export const combinationsRepo: Repo<CombinationCreate, CombinationUpdate, Combination> = {
  async list(ctx, page) {
    const rows = await ctx.db
      .select()
      .from(combinations)
      .where(beforeCursor(combinations.id, page))
      .orderBy(desc(combinations.id))
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (c) => c.id),
      toCombination,
    )
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(combinations).where(eq(combinations.id, id)).get()
    return row ? toCombination(row) : null
  },
  async create(ctx, input) {
    return toCombination(await ctx.db.insert(combinations).values(input).returning().get())
  },
  async update(ctx, id, input) {
    if (!hasChanges(input)) return this.get(ctx, id)
    const row = await ctx.db.update(combinations).set(input).where(eq(combinations.id, id)).returning().get()
    return row ? toCombination(row) : null
  },
  async remove(ctx, id) {
    return !!(await ctx.db.delete(combinations).where(eq(combinations.id, id)).returning().get())
  },
}
