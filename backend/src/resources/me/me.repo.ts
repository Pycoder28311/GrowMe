import { roundCoordinate, type LocationSet, type Page, type Post, type UserLocation } from '@growme/shared'
import { and, desc, eq } from 'drizzle-orm'
import { likes, userLocations } from '../../db/schema'
import { userId, type Ctx } from '../../lib/crud'
import { areaName } from '../../lib/geocode'
import { beforeCursor, fetchLimit, toPage, type PageParams } from '../../lib/pagination'
import { postsByIds } from '../posts/posts.repo'

const toJson = (l: typeof userLocations.$inferSelect): UserLocation => ({
  area: l.area,
  lat: l.lat,
  lng: l.lng,
  updatedAt: l.updatedAt.toISOString(),
})

/** The signed-in user's own data: their area and the posts they liked */
export const meRepo = {
  async location(ctx: Ctx) {
    const row = await ctx.db.select().from(userLocations).where(eq(userLocations.userId, userId(ctx))).get()
    return row ? toJson(row) : null
  },

  /** Saves the area, rounded to about 1 km; Google's name for it wins over the phone's when a key is set */
  async setLocation(ctx: Ctx, input: LocationSet) {
    const lat = roundCoordinate(input.lat)
    const lng = roundCoordinate(input.lng)
    const area = (await areaName(ctx.env, lat, lng)) ?? input.area
    const values = { userId: userId(ctx), area, lat, lng, updatedAt: new Date() }
    const row = await ctx.db
      .insert(userLocations)
      .values(values)
      .onConflictDoUpdate({ target: userLocations.userId, set: { area, lat, lng, updatedAt: values.updatedAt } })
      .returning()
      .get()
    return toJson(row)
  },

  async removeLocation(ctx: Ctx) {
    await ctx.db.delete(userLocations).where(eq(userLocations.userId, userId(ctx)))
  },

  /** Posts I liked (not disliked), the newest like first; the cursor follows the likes */
  async likedPosts(ctx: Ctx, page: PageParams): Promise<Page<Post>> {
    const rows = await ctx.db
      .select({ likeId: likes.id, postId: likes.likedId })
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId(ctx)),
          eq(likes.likedType, 'post'),
          eq(likes.isLike, true),
          beforeCursor(likes.id, page),
        ),
      )
      .orderBy(desc(likes.id))
      .limit(fetchLimit(page) ?? -1)
    const { items, nextCursor } = toPage(rows, page, (r) => r.likeId)
    return { items: await postsByIds(ctx, items.map((r) => r.postId)), nextCursor }
  },
}
