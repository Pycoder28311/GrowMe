import { commentCreate, commentFilter, commentUpdate } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { blogCommentsRepo } from './blog-comments.repo'

/**
 * GET /?blogId=[&parentCommentId=] (paginated) · GET /:id · POST / · PATCH /:id (owner)
 * · DELETE /:id (owner or admin; deletes the answers too)
 */
export default crudRoutes({
  access: 'public-owner',
  create: commentCreate,
  update: commentUpdate,
  filter: commentFilter,
  repo: blogCommentsRepo,
})
