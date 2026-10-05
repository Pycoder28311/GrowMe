import { plantCreate, plantFilter, plantUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { plantsRepo } from './plants.repo'

/**
 * GET /[?combinationId=] (paginated, summaries) · GET /:id (with lifecycles, tips, diseases, images)
 * · POST / · PATCH /:id · DELETE /:id (writes: admins only)
 */
export default crudRoutes({
  access: 'public-admin',
  create: plantCreate,
  update: plantUpdate,
  filter: plantFilter,
  repo: plantsRepo,
})
