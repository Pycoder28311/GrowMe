import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './auth'
import type { AppEnv } from './middleware/auth'
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

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' })
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))

const routes = app.route('/api/notes', notesRoutes).route('/api/images', imagesRoutes)

export type AppType = typeof routes
export default app
