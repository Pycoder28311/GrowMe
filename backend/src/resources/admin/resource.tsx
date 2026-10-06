import { pageQuery, type Page } from '@growme/shared'
import { Hono } from 'hono'
import type { FC } from 'hono/jsx'
import { z } from 'zod'
import { getDb } from '../../db'
import type { Ctx } from '../../lib/crud'
import { notFound } from '../../lib/errors'
import { toPageParams, type PageParams } from '../../lib/pagination'
import { parseOrThrow, validate } from '../../lib/validate'
import type { AdminEnv } from '../../middleware/access'
import { FormPage, ListPage } from './ui/pages'

/**
 * One object type on the dashboard (e.g. plants). adminResource() turns it into:
 *   GET /{path}                 list page (?cursor= for the next page)
 *   GET /{path}/new             empty form
 *   GET /{path}/:id             filled form
 *   POST   /api/admin/{path}       create → 201 { id }
 *   PUT    /api/admin/{path}/:id   replace → { id }
 *   DELETE /api/admin/{path}/:id   → 204
 * The data functions get a Ctx with no app user: the admin is whoever passed Cloudflare Access.
 */
export type AdminResource<TListItem, TItem, TSave, TOptions> = {
  path: string
  /** Plural, for the list and the home card (e.g. "Φυτά") */
  title: string
  /** One item, for the form's title (e.g. "φυτό") */
  singular: string
  schema: z.ZodType<TSave>
  list: (ctx: Ctx, page: PageParams) => Promise<Page<TListItem>>
  get: (ctx: Ctx, id: number) => Promise<TItem | null>
  /** id null = create; returns null when the item to update doesn't exist */
  save: (ctx: Ctx, id: number | null, input: TSave) => Promise<{ id: number } | null>
  remove: (ctx: Ctx, id: number) => Promise<boolean>
  /** Extra data the form needs (e.g. the combinations for a dropdown) */
  options: (ctx: Ctx) => Promise<TOptions>
  /** Title shown on an existing item's form */
  itemTitle: (item: TItem) => string
  ListItem: FC<{ item: TListItem; href: string }>
  Form: FC<{ item: TItem | null; options: TOptions }>
}

const idParam = z.object({ id: z.coerce.number().int().positive() })

const adminCtx = (env: CloudflareBindings): Ctx => ({ db: getDb(env), env, user: null })

export function adminResource<TListItem extends { id: number }, TItem, TSave, TOptions>(
  r: AdminResource<TListItem, TItem, TSave, TOptions>,
) {
  const base = `/${r.path}`
  const api = `/api/admin/${r.path}`

  const formPage = (email: string, id: number | null, item: TItem | null, options: TOptions) => (
    <FormPage
      title={item ? r.itemTitle(item) : `Νέο ${r.singular}`}
      email={email}
      basePath={base}
      listTitle={r.title}
      api={api}
      id={id}
    >
      <r.Form item={item} options={options} />
    </FormPage>
  )

  return new Hono<AdminEnv>()
    .get(base, async (c) => {
      const page = toPageParams(parseOrThrow(pageQuery, c.req.query()))
      const { items, nextCursor } = await r.list(adminCtx(c.env), page)
      return c.html(
        <ListPage title={r.title} singular={r.singular} email={c.get('adminEmail')} basePath={base} nextCursor={nextCursor}>
          {items.map((item) => (
            <r.ListItem item={item} href={`${base}/${item.id}`} />
          ))}
        </ListPage>,
      )
    })
    .get(`${base}/new`, async (c) => {
      return c.html(formPage(c.get('adminEmail'), null, null, await r.options(adminCtx(c.env))))
    })
    .get(`${base}/:id`, validate('param', idParam), async (c) => {
      const ctx = adminCtx(c.env)
      const { id } = c.req.valid('param')
      const [item, options] = await Promise.all([r.get(ctx, id), r.options(ctx)])
      if (!item) throw notFound()
      return c.html(formPage(c.get('adminEmail'), id, item, options))
    })
    .post(api, validate('json', r.schema), async (c) => {
      const saved = await r.save(adminCtx(c.env), null, c.req.valid('json') as TSave)
      return c.json(saved, 201)
    })
    .put(`${api}/:id`, validate('param', idParam), validate('json', r.schema), async (c) => {
      const saved = await r.save(adminCtx(c.env), c.req.valid('param').id, c.req.valid('json') as TSave)
      if (!saved) throw notFound()
      return c.json(saved)
    })
    .delete(`${api}/:id`, validate('param', idParam), async (c) => {
      if (!(await r.remove(adminCtx(c.env), c.req.valid('param').id))) throw notFound()
      return c.body(null, 204)
    })
}
