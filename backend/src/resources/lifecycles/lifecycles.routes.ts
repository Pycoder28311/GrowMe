import { lifecycleCreate, lifecycleUpdate, plantChildFilter } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { lifecyclesRepo } from './lifecycles.repo'

/** GET /?plantId= (all, in order) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  paginate: false,
  create: lifecycleCreate,
  update: lifecycleUpdate,
  filter: plantChildFilter,
  repo: lifecyclesRepo,
})
