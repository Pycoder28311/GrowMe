import { z } from 'zod'
import { entityId, queryId } from './common'

/** Everything that can be liked */
export const LIKED_TYPES = ['post', 'post_reply', 'blog', 'blog_comment'] as const
export type LikedType = (typeof LIKED_TYPES)[number]

const likedType = z.enum(LIKED_TYPES)

/** PUT /api/likes: like (isLike true) or dislike (false); sending the same again changes nothing */
export const likeSet = z.object({
  type: likedType,
  id: entityId,
  isLike: z.boolean().default(true),
})

/** DELETE /api/likes/:type/:id: remove my like or dislike */
export const likeTarget = z.object({
  type: likedType,
  id: queryId,
})

/** GET /api/likes?type=post&ids=1,2,3: my reactions to the items on screen */
export const myLikesQuery = z.object({
  type: likedType,
  ids: z
    .string()
    .transform((s) => s.split(',').map(Number))
    .pipe(z.array(entityId).min(1).max(100)),
})

export type LikeSet = z.infer<typeof likeSet>
export type LikeTarget = z.infer<typeof likeTarget>
export type MyLikesQuery = z.infer<typeof myLikesQuery>

/** One of my reactions: liked (true) or disliked (false); items I didn't react to are left out */
export type MyLike = {
  id: number
  isLike: boolean
}

/** Answer of PUT and DELETE: the item's new like count and my reaction (null = none) */
export type LikeState = {
  likeCount: number
  isLike: boolean | null
}
