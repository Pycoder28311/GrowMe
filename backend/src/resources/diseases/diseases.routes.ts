import { diseaseCreate, diseaseUpdate, plantChildFilter } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { diseasesRepo } from './diseases.repo'

/** GET /?plantId= (all) · GET /:id · POST / · PATCH /:id · DELETE /:id (writes: admins only) */
export default crudRoutes({
  access: 'public-admin',
  paginate: false,
  create: diseaseCreate,
  update: diseaseUpdate,
  filter: plantChildFilter,
  repo: diseasesRepo,
})
