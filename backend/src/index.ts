import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createAuth } from './auth'
import { getConfig } from './lib/config'
import { codeForStatus, errorBody, HttpError } from './lib/errors'
import type { AppEnv } from './middleware/auth'
import { csrfProtection } from './middleware/csrf'
import { checkEnv } from './middleware/env'
import { rateLimit } from './middleware/rate-limit'
import adminApp from './resources/admin/admin.app'
import blogCommentsRoutes from './resources/blog-comments/blog-comments.routes'
import blogsRoutes from './resources/blogs/blogs.routes'
import combinationsRoutes from './resources/combinations/combinations.routes'
import diseasesRoutes from './resources/diseases/diseases.routes'
import imagesRoutes from './resources/images/images.routes'
import lifecyclesRoutes from './resources/lifecycles/lifecycles.routes'
import likesRoutes from './resources/likes/likes.routes'
import notesRoutes from './resources/notes/notes.routes'
import plantsRoutes from './resources/plants/plants.routes'
import postRepliesRoutes from './resources/post-replies/post-replies.routes'
import postsRoutes from './resources/posts/posts.routes'
import tipsRoutes from './resources/tips/tips.routes'

const app = new Hono<AppEnv>()

// Fails loudly (500 SERVER_MISCONFIGURED) when variables or bindings are missing
app.use('*', checkEnv)

// The admin domain is a separate app behind Cloudflare Access (resources/admin/admin.app.tsx):
// it serves only the dashboard, and the admin routes exist nowhere else
app.use('*', async (c, next) => {
  if (new URL(c.req.url).hostname === getConfig(c.env).admin.host) {
    return adminApp.fetch(c.req.raw, c.env, c.executionCtx)
  }
  await next()
})

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => (getConfig(c.env).webOrigins.includes(origin) ? origin : null),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600, // browsers reuse the OPTIONS answer for 10 minutes
  }),
)

// After CORS, so blocked answers can still be read by the browser
app.use('/api/*', csrfProtection)
app.use('/api/*', rateLimit)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))

// One line per resource (see instructions/adding-a-resource.md)
const routes = app
  .route('/api/notes', notesRoutes)
  .route('/api/images', imagesRoutes)
  .route('/api/posts', postsRoutes)
  .route('/api/post-replies', postRepliesRoutes)
  .route('/api/blogs', blogsRoutes)
  .route('/api/blog-comments', blogCommentsRoutes)
  .route('/api/likes', likesRoutes)
  .route('/api/plants', plantsRoutes)
  .route('/api/lifecycles', lifecyclesRoutes)
  .route('/api/tips', tipsRoutes)
  .route('/api/diseases', diseasesRoutes)
  .route('/api/combinations', combinationsRoutes)

// Serves R2 files through the Worker: used locally (production uses the IMAGES_URL domain)
app.get('/images/*', async (c) => {
  const object = await c.env.BUCKET.get(c.req.path.slice('/images/'.length))
  if (!object) return c.json(errorBody('NOT_FOUND', 'Image not found'), 404)
  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
  })
})

app.notFound((c) => c.json(errorBody('NOT_FOUND', 'Route not found'), 404))

// Every error answers { code, message, details? }; unexpected ones are logged and hidden
app.onError((err, c) => {
  if (err instanceof HttpError) return c.json(errorBody(err.code, err.message, err.details), err.status)
  if (err instanceof HTTPException) {
    return c.json(errorBody(codeForStatus(err.status), err.message || 'Request failed'), err.status)
  }
  console.error(err)
  return c.json(errorBody('INTERNAL', 'Something went wrong. Please try again.'), 500)
})

export type AppType = typeof routes
export default app
