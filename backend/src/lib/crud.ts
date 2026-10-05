import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb, type Db } from '../db'
import { requireAuth, type AppEnv } from '../middleware/auth'

/** Everything a data function needs: the database, the bindings and who is asking */
export type Ctx = { db: Db; env: CloudflareBindings; userId: string }

/** The data functions a resource provides; crudRoutes() turns them into HTTP routes */
export type Repo<TCreate, TUpdate, TOut> = {
  list: (ctx: Ctx) => Promise<TOut[]>
  get: (ctx: Ctx, id: number) => Promise<TOut | null>
  create: (ctx: Ctx, input: TCreate) => Promise<TOut>
  update: (ctx: Ctx, id: number, input: TUpdate) => Promise<TOut | null>
  remove: (ctx: Ctx, id: number) => Promise<boolean>
}

const idParam = z.object({ id: z.coerce.number().int().positive() })

/**
 * Standard, signed-in-only CRUD routes for one resource:
 * GET / · GET /:id · POST / · PATCH /:id · DELETE /:id
 * Handles auth, validation, 404s and status codes; the repo handles the data.
 */
export function crudRoutes<C extends z.ZodType, U extends z.ZodType, O>(opts: {
  create: C
  update: U
  repo: Repo<z.infer<C>, z.infer<U>, O>
}) {
  const { repo } = opts
  const ctx = (c: { env: CloudflareBindings; get: (k: 'user') => { id: string } }): Ctx => ({
    db: getDb(c.env),
    env: c.env,
    userId: c.get('user').id,
  })

  return new Hono<AppEnv>()
    .use(requireAuth)
    .get('/', async (c) => c.json(await repo.list(ctx(c))))
    .get('/:id', zValidator('param', idParam), async (c) => {
      const item = await repo.get(ctx(c), c.req.valid('param').id)
      return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
    })
    .post('/', zValidator('json', opts.create), async (c) => {
      return c.json(await repo.create(ctx(c), c.req.valid('json') as z.infer<C>), 201)
    })
    .patch('/:id', zValidator('param', idParam), zValidator('json', opts.update), async (c) => {
      const item = await repo.update(ctx(c), c.req.valid('param').id, c.req.valid('json') as z.infer<U>)
      return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
    })
    .delete('/:id', zValidator('param', idParam), async (c) => {
      return (await repo.remove(ctx(c), c.req.valid('param').id))
        ? c.body(null, 204)
        : c.json({ error: 'Not found' }, 404)
    })
}
