import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './auth'
import type { AppEnv } from './middleware/auth'
import { rateLimit } from './middleware/rate-limit'
import imagesRoutes from './routes/images'
import notesRoutes from './routes/notes'

const app = new Hono<AppEnv>()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:8081'], // add your web app's domain later
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

// After CORS, so "too many attempts" answers can be read by the browser
app.use('/api/*', rateLimit)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))

const routes = app.route('/api/notes', notesRoutes).route('/api/images', imagesRoutes)

// Serves R2 files through the Worker: used locally (production uses images.testingggg.lol)
app.get('/images/*', async (c) => {
  const object = await c.env.images.get(c.req.path.slice('/images/'.length))
  if (!object) return c.notFound()
  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
  })
})

export type AppType = typeof routes
export default app
