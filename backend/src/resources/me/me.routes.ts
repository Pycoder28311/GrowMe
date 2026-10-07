import { locationSet, pageQuery } from '@growme/shared'
import { Hono } from 'hono'
import { toCtx } from '../../lib/crud'
import { toPageParams } from '../../lib/pagination'
import { validate } from '../../lib/validate'
import { requireAuth, type AuthedEnv } from '../../middleware/auth'
import { meRepo } from './me.repo'

/**
 * The signed-in user's own data (the profile page). Name and password changes go through Better Auth
 * (/api/auth/update-user, /api/auth/change-password).
 *   GET /location → UserLocation | null · PUT /location { lat, lng, area } · DELETE /location → 204
 *   GET /liked-posts?limit=&cursor= → Page<Post> (the newest like first)
 */
const meRoutes = new Hono<AuthedEnv>()
  .use(requireAuth)
  .get('/location', async (c) => c.json(await meRepo.location(toCtx(c))))
  .put('/location', validate('json', locationSet), async (c) => c.json(await meRepo.setLocation(toCtx(c), c.req.valid('json'))))
  .delete('/location', async (c) => {
    await meRepo.removeLocation(toCtx(c))
    return c.body(null, 204)
  })
  .get('/liked-posts', validate('query', pageQuery), async (c) =>
    c.json(await meRepo.likedPosts(toCtx(c), toPageParams(c.req.valid('query')))),
  )

export default meRoutes
