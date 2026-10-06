import { tipCreate, tipUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { tipsRepo } from './tips.repo'

/** GET / (the library, paginated) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  create: tipCreate,
  update: tipUpdate,
  repo: tipsRepo,
})
