import { blogCreate, blogUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { blogsRepo } from './blogs.repo'

/** GET / (paginated) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({ access: 'public-admin', create: blogCreate, update: blogUpdate, repo: blogsRepo })
