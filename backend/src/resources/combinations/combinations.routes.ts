import { combinationCreate, combinationUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { combinationsRepo } from './combinations.repo'

/** GET / (paginated) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  create: combinationCreate,
  update: combinationUpdate,
  repo: combinationsRepo,
})
