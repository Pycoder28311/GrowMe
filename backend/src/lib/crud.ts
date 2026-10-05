import { pageQuery, type Page } from '@growme/shared'
import { Hono, type Context, type MiddlewareHandler } from 'hono'
import { every } from 'hono/combine'
import { z } from 'zod'
import type { SessionUser } from '../auth'
import { getDb, type Db } from '../db'
import { optionalAuth, requireAuth, requireRole, type AppEnv } from '../middleware/auth'
import { notFound, unauthorized } from './errors'
import { toPageParams, type PageParams } from './pagination'
import { parseOrThrow, validate } from './validate'

/**
 * Who may read and write a resource:
 * - owner:        signed in; each user sees and changes only their own rows (e.g. notes)
 * - public-owner: everyone reads; signed-in users create; owners change their own rows (e.g. posts)
 * - public-admin: everyone reads; only admins write (e.g. plants, blogs)
 * - admin:        only admins read and write (e.g. moderation)
 */
export type Access = 'owner' | 'public-owner' | 'public-admin' | 'admin'

/** Everything a data function needs: the database, the bindings and who is asking (null = anonymous) */
export type Ctx = { db: Db; env: CloudflareBindings; user: SessionUser | null }

/** The signed-in user's id; throws 401 when anonymous (use it in every owner filter) */
export function userId(ctx: Ctx): string {
  if (!ctx.user) throw unauthorized()
  return ctx.user.id
}

/** The data functions a resource provides; crudRoutes() turns them into HTTP routes */
export type Repo<TCreate, TUpdate, TOut> = {
  /** page is null when the resource isn't paginated: return every row with nextCursor null */
  list: (ctx: Ctx, page: PageParams | null) => Promise<Page<TOut>>
  get: (ctx: Ctx, id: number) => Promise<TOut | null>
  create: (ctx: Ctx, input: TCreate) => Promise<TOut>
  update: (ctx: Ctx, id: number, input: TUpdate) => Promise<TOut | null>
  remove: (ctx: Ctx, id: number) => Promise<boolean>
}

const idParam = z.object({ id: z.coerce.number().int().positive() })

const adminOnly = every(requireAuth, requireRole('admin')) as MiddlewareHandler<AppEnv>
const signedIn = requireAuth as unknown as MiddlewareHandler<AppEnv>

const guards: Record<Access, { read: MiddlewareHandler<AppEnv>; write: MiddlewareHandler<AppEnv> }> = {
  owner: { read: signedIn, write: signedIn },
  'public-owner': { read: optionalAuth, write: signedIn },
  'public-admin': { read: optionalAuth, write: adminOnly },
  admin: { read: adminOnly, write: adminOnly },
}

const toCtx = (c: Context<AppEnv>): Ctx => ({ db: getDb(c.env), env: c.env, user: c.get('user') })

/**
 * Standard CRUD routes for one resource:
 * GET / · GET /:id · POST / · PATCH /:id · DELETE /:id
 * Handles access, validation, pagination, 404s and status codes; the repo handles the data.
 * Paginated lists answer { items, nextCursor } and accept ?limit=&cursor=; otherwise a plain array.
 */
export function crudRoutes<C extends z.ZodType, U extends z.ZodType, O>(opts: {
  access: Access
  paginate?: boolean
  create: C
  update: U
  repo: Repo<z.infer<C>, z.infer<U>, O>
}) {
  const { repo, access, paginate = true } = opts
  const { read, write } = guards[access]

  return new Hono<AppEnv>()
    .get('/', read, async (c) => {
      if (!paginate) return c.json((await repo.list(toCtx(c), null)).items)
      const page = toPageParams(parseOrThrow(pageQuery, c.req.query()))
      return c.json(await repo.list(toCtx(c), page))
    })
    .get('/:id', read, validate('param', idParam), async (c) => {
      const item = await repo.get(toCtx(c), c.req.valid('param').id)
      if (!item) throw notFound()
      return c.json(item)
    })
    .post('/', write, validate('json', opts.create), async (c) => {
      return c.json(await repo.create(toCtx(c), c.req.valid('json') as z.infer<C>), 201)
    })
    .patch('/:id', write, validate('param', idParam), validate('json', opts.update), async (c) => {
      const item = await repo.update(toCtx(c), c.req.valid('param').id, c.req.valid('json') as z.infer<U>)
      if (!item) throw notFound()
      return c.json(item)
    })
    .delete('/:id', write, validate('param', idParam), async (c) => {
      if (!(await repo.remove(toCtx(c), c.req.valid('param').id))) throw notFound()
      return c.body(null, 204)
    })
}
