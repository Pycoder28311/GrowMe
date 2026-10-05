import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createAuth } from './auth'
import { HttpError } from './lib/errors'
import { WEB_ORIGINS } from './lib/origins'
import type { AppEnv } from './middleware/auth'
import { csrfProtection } from './middleware/csrf'
import { rateLimit } from './middleware/rate-limit'
import imagesRoutes from './resources/images/images.routes'
import notesRoutes from './resources/notes/notes.routes'

const app = new Hono<AppEnv>()

app.use(
  '/api/*',
  cors({
    origin: WEB_ORIGINS,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Serves R2 files through the Worker: used locally (production uses images.testingggg.lol)
app.get('/images/*', async (c) => {
  const object = await c.env.images.get(c.req.path.slice('/images/'.length))
  if (!object) return c.notFound()
  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
  })
})

// Known errors become clean JSON; anything else is logged and hidden from clients
app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export type AppType = typeof routes
export default app
