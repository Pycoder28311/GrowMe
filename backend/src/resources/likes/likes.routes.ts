import { likeSet, likeTarget, myLikesQuery } from '@growme/shared'
import { Hono } from 'hono'
import { toCtx } from '../../lib/crud'
import { validate } from '../../lib/validate'
import { requireAuth, type AuthedEnv } from '../../middleware/auth'
import { likesRepo } from './likes.repo'

/** Not plain CRUD (one reaction per user per item), so a normal router */
const likesRoutes = new Hono<AuthedEnv>()
  .use(requireAuth)
  // GET /api/likes?type=post&ids=1,2,3 → [{ id, isLike }] for the items I reacted to
  .get('/', validate('query', myLikesQuery), async (c) => {
    const { type, ids } = c.req.valid('query')
    return c.json(await likesRepo.mine(toCtx(c), type, ids))
  })
  // PUT /api/likes { type, id, isLike } → { likeCount, isLike }
  .put('/', validate('json', likeSet), async (c) => {
    const { type, id, isLike } = c.req.valid('json')
    return c.json(await likesRepo.set(toCtx(c), type, id, isLike))
  })
  // DELETE /api/likes/:type/:id → { likeCount, isLike: null }
  .delete('/:type/:id', validate('param', likeTarget), async (c) => {
    const { type, id } = c.req.valid('param')
    return c.json(await likesRepo.remove(toCtx(c), type, id))
  })

export default likesRoutes
