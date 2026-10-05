import { plantChildFilter, tipCreate, tipUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { tipsRepo } from './tips.repo'

/** GET /?plantId= (all, by position) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  paginate: false,
  create: tipCreate,
  update: tipUpdate,
  filter: plantChildFilter,
  repo: tipsRepo,
})
