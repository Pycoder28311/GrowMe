import { postCreate, postFilter, postUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { postsRepo } from './posts.repo'

/** GET / (paginated; ?plantId= for one plant's posts) · GET /:id · POST / · PATCH /:id (owner) · DELETE /:id (owner or admin) */
export default crudRoutes({ access: 'public-owner', create: postCreate, update: postUpdate, filter: postFilter, repo: postsRepo })
