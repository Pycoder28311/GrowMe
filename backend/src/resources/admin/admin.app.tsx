import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { getDb } from '../../db'
import { getConfig } from '../../lib/config'
import { codeForStatus, errorBody, HttpError } from '../../lib/errors'
import { requireAccess, type AdminEnv } from '../../middleware/access'
import { storeImages } from '../images/images.repo'
import { tableCounts } from './admin.repo'
import { DashboardPage } from './admin.page'
import { blogsAdmin } from './blogs/blogs.admin'
import { combinationsAdmin } from './combinations/combinations.admin'
import {
  blogCommentsAdmin,
  imagesAdmin,
  likesAdmin,
  notesAdmin,
  postRepliesAdmin,
  postsAdmin,
  usersAdmin,
} from './lists'
import { plantsAdmin } from './plants/plants.admin'
import { tipsAdmin } from './tips/tips.admin'
import { ASSETS } from './ui/layout'

/**
 * Pages may load only our own script and CSS, Google Fonts and our images; nothing can frame them.
 * IMAGES_URL's origin is where uploaded photos are served from.
 */
const contentSecurityPolicy = (imagesUrl: string) =>
  [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    // The article editor writes text alignment as style="" attributes (never <style> tags or scripts)
    "style-src-attr 'unsafe-inline'",
    'font-src https://fonts.gstatic.com',
    `img-src 'self' ${new URL(imagesUrl).origin}`,
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ')

/**
 * Everything served on the admin domain (ADMIN_HOST). It is a separate app: the admin domain serves
 * nothing else, and none of this exists on the API's other addresses (e.g. workers.dev).
 * Every request must carry a valid Cloudflare Access token (requireAccess).
 */
const adminApp = new Hono<AdminEnv>()
  // Changes (POST/PUT/DELETE with form data) only from the dashboard itself; JSON requests from other
  // sites are already stopped by the browser (no CORS here)
  .use(csrf({ origin: (origin, c) => origin === `https://${getConfig(c.env).admin.host}` }))
  .use(requireAccess)
  .use(async (c, next) => {
    await next()
    // Private data that changes: never cached (the versioned script and CSS set their own)
    if (!c.res.headers.has('Cache-Control')) c.header('Cache-Control', 'no-store')
    c.header('Content-Security-Policy', contentSecurityPolicy(c.env.IMAGES_URL))
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'same-origin')
  })
  .get('/', async (c) =>
    c.html(<DashboardPage email={c.get('adminEmail')} counts={await tableCounts(getDb(c.env))} />),
  )
  .get('/api/admin/me', (c) => c.json({ email: c.get('adminEmail') }))
  .get('/api/admin/stats', async (c) => c.json(await tableCounts(getDb(c.env))))
  // Photos for the forms: stored with no owner (admin uploads), linked when a form is saved
  .post('/api/admin/images', async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = [body.files].flat().filter((f): f is File => f instanceof File)
    return c.json(await storeImages(c.env, files, null), 201)
  })
  // Objects with forms (list, create, edit, delete)
  .route('/', plantsAdmin)
  .route('/', blogsAdmin)
  .route('/', tipsAdmin)
  .route('/', combinationsAdmin)
  // Lists with delete only
  .route('/', usersAdmin)
  .route('/', postsAdmin)
  .route('/', postRepliesAdmin)
  .route('/', blogCommentsAdmin)
  .route('/', likesAdmin)
  .route('/', imagesAdmin)
  .route('/', notesAdmin)

// The script and the CSS (behind Access like everything else); ?v= changes on every edit
for (const asset of Object.values(ASSETS)) {
  adminApp.get(asset.path, (c) => {
    c.header('Content-Type', asset.type)
    c.header('Cache-Control', 'private, max-age=31536000, immutable')
    return c.body(asset.body)
  })
}

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
