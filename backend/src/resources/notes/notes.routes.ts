import { noteInput } from '@growme/shared'
import { crudRoutes } from '../../lib/crud'
import { notesRepo } from './notes.repo'

/**
 * GET / · GET /:id · POST / · PATCH /:id · DELETE /:id, each user only sees their own notes.
 * paginate: false keeps GET / a plain array until the app switches to pages (see docs/plans/01).
 */
export default crudRoutes({ access: 'owner', paginate: false, create: noteInput, update: noteInput, repo: notesRepo })
