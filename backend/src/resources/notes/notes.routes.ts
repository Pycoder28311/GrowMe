import { crudRoutes } from '../../lib/crud'
import { notesRepo } from './notes.repo'
import { noteInput } from './notes.schema'

/** GET / · GET /:id · POST / · PATCH /:id · DELETE /:id, all scoped to the signed-in user */
export default crudRoutes({ create: noteInput, update: noteInput, repo: notesRepo })
