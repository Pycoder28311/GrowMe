import { replyCreate, replyFilter, replyUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { postRepliesRepo } from './post-replies.repo'

/** GET /?postId= (paginated) · GET /:id · POST / · PATCH /:id (owner) · DELETE /:id (owner or admin) */
export default crudRoutes({
  access: 'public-owner',
  create: replyCreate,
  update: replyUpdate,
  filter: replyFilter,
  repo: postRepliesRepo,
})
