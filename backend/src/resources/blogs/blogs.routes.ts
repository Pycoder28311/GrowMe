import { blogCreate, blogFilter, blogUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { blogsRepo } from './blogs.repo'

/** GET /[?kind=] (paginated) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  create: blogCreate,
  update: blogUpdate,
  filter: blogFilter,
  repo: blogsRepo,
})
