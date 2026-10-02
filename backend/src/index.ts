import { Hono } from 'hono'
import { cors } from 'hono/cors'
import imagesRoutes from './routes/images'
import notesRoutes from './routes/notes'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('/api/*', cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' })
})

const routes = app.route('/api/notes', notesRoutes).route('/api/images', imagesRoutes)

export type AppType = typeof routes
export default app
