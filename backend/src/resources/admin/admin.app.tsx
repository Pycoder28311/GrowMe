import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { getDb } from '../../db'
import { getConfig } from '../../lib/config'
import { codeForStatus, errorBody, HttpError } from '../../lib/errors'
import { requireAccess, type AdminEnv } from '../../middleware/access'
import { tableCounts } from './admin.repo'
import { DashboardPage } from './admin.page'

/**
 * Everything served on the admin domain (ADMIN_HOST). It is a separate app: the admin domain serves
 * nothing else, and none of this exists on the API's other addresses (e.g. workers.dev).
 * Every request must carry a valid Cloudflare Access token (requireAccess).
 */
const adminApp = new Hono<AdminEnv>()
  // Changes (POST/PATCH/DELETE) only from the dashboard itself
  .use(csrf({ origin: (origin, c) => origin === `https://${getConfig(c.env).admin.host}` }))
  .use(requireAccess)
  // Never cached: the data is private and changes
  .use(async (c, next) => {
    await next()
    c.header('Cache-Control', 'no-store')
  })
  .get('/', async (c) =>
    c.html(<DashboardPage email={c.get('adminEmail')} counts={await tableCounts(getDb(c.env))} />),
  )
  .get('/api/admin/me', (c) => c.json({ email: c.get('adminEmail') }))
  .get('/api/admin/stats', async (c) => c.json(await tableCounts(getDb(c.env))))

adminApp.notFound((c) => c.json(errorBody('NOT_FOUND', 'Route not found'), 404))

adminApp.onError((err, c) => {
  if (err instanceof HttpError) return c.json(errorBody(err.code, err.message, err.details), err.status)
  if (err instanceof HTTPException) {
    return c.json(errorBody(codeForStatus(err.status), err.message || 'Request failed'), err.status)
  }
  console.error(err)
  return c.json(errorBody('INTERNAL', 'Something went wrong. Please try again.'), 500)
})

export default adminApp
