import { Hono } from 'hono'
import { requireAuth, type AuthedEnv } from '../../middleware/auth'
import { storeImages } from './images.repo'

/** Not plain CRUD (multipart files), so a normal router instead of crudRoutes() */
const imagesRoutes = new Hono<AuthedEnv>()
  .use(requireAuth)
  // Upload one or more images in a single request (multipart field "files")
  .post('/', async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = [body.files].flat().filter((f): f is File => f instanceof File)
    return c.json(await storeImages(c.env, files, c.get('user').id), 201)
  })

export default imagesRoutes
