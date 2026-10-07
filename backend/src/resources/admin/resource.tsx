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

/** Create and edit pages for an object type (left out for lists that only show and delete) */
export type AdminEdit<TItem, TSave, TOptions> = {
  /** One item, for the form's title (e.g. "φυτό") */
  singular: string
  /** The empty form's title when «Νέο …» doesn't fit (e.g. «Νέα συμβουλή»); default «Νέο {singular}» */
  newTitle?: string
  schema: z.ZodType<TSave>
  get: (ctx: Ctx, id: number) => Promise<TItem | null>
  /** id null = create; returns null when the item to update doesn't exist */
  save: (ctx: Ctx, id: number | null, input: TSave) => Promise<{ id: number } | null>
  /** Extra data the form needs (e.g. the combinations for a dropdown) */
  options: (ctx: Ctx) => Promise<TOptions>
  /** Title shown on an existing item's form */
  itemTitle: (item: TItem) => string
  /** The question the form's Delete button asks (e.g. how many texts link to a blog) */
  deleteConfirm?: (item: TItem) => string
  Form: FC<{ item: TItem | null; options: TOptions }>
}

/**
 * One object type on the dashboard (e.g. plants). adminResource() turns it into:
 *   GET /{path}                   list page (?cursor= for the next page)
 *   DELETE /api/admin/{path}/:id  → 204
 * and, with `edit`:
 *   GET /{path}/new · GET /{path}/:id                    empty and filled forms
 *   POST /api/admin/{path} · PUT /api/admin/{path}/:id   create → 201 { id } · replace → { id }
 * The data functions get a Ctx with no app user: the admin is whoever passed Cloudflare Access.
 */
export type AdminResource<TListItem extends { id: number | string }, TItem, TSave, TOptions> = {
  path: string
  /** Plural, for the list and the home card (e.g. "Φυτά") */
  title: string
  list: (ctx: Ctx, page: PageParams) => Promise<Page<TListItem>>
  /** id as it appears in the URL (numbers arrive as text: use numericId) */
  remove: (ctx: Ctx, id: string) => Promise<boolean>
  /** A list item. With `edit`, `href` opens its form; without, it shows a delete button for `deleteUrl` */
  ListItem: FC<{ item: TListItem; href: string | null; deleteUrl: string }>
  edit?: AdminEdit<TItem, TSave, TOptions>
}

const idParam = z.object({ id: z.coerce.number().int().positive() })
const anyIdParam = z.object({ id: z.string().min(1).max(100) })

/** A numeric id from the URL; null (the item is "not found") when it isn't one */
export function numericId(raw: string) {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export const adminCtx = (env: CloudflareBindings): Ctx => ({ db: getDb(env), env, user: null })

export function adminResource<
  TListItem extends { id: number | string },
  TItem = never,
  TSave = never,
  TOptions = never,
>(r: AdminResource<TListItem, TItem, TSave, TOptions>) {
  const base = `/${r.path}`
  const api = `/api/admin/${r.path}`

  const router = new Hono<AdminEnv>()
    .get(base, async (c) => {
      const page = toPageParams(parseOrThrow(pageQuery, c.req.query()))
      const { items, nextCursor } = await r.list(adminCtx(c.env), page)
      return c.html(
        <ListPage
          title={r.title}
          email={c.get('adminEmail')}
          basePath={base}
          nextCursor={nextCursor}
          canCreate={!!r.edit}
        >
          {items.map((item) => (
            <r.ListItem
              item={item}
              href={r.edit ? `${base}/${item.id}` : null}
              deleteUrl={`${api}/${encodeURIComponent(String(item.id))}`}
            />
          ))}
        </ListPage>,
      )
    })
    .delete(`${api}/:id`, validate('param', anyIdParam), async (c) => {
      if (!(await r.remove(adminCtx(c.env), c.req.valid('param').id))) throw notFound()
      return c.body(null, 204)
    })

  const edit = r.edit
  if (!edit) return router

  const formPage = (email: string, id: number | null, item: TItem | null, options: TOptions) => (
    <FormPage
      title={item ? edit.itemTitle(item) : (edit.newTitle ?? `Νέο ${edit.singular}`)}
      email={email}
      basePath={base}
      listTitle={r.title}
      api={api}
      id={id}
      deleteConfirm={item && edit.deleteConfirm ? edit.deleteConfirm(item) : undefined}
    >
      <edit.Form item={item} options={options} />
    </FormPage>
  )

  return router
    .get(`${base}/new`, async (c) => {
      return c.html(formPage(c.get('adminEmail'), null, null, await edit.options(adminCtx(c.env))))
    })
    .get(`${base}/:id`, validate('param', idParam), async (c) => {
      const ctx = adminCtx(c.env)
      const { id } = c.req.valid('param')
      const [item, options] = await Promise.all([edit.get(ctx, id), edit.options(ctx)])
      if (!item) throw notFound()
      return c.html(formPage(c.get('adminEmail'), id, item, options))
    })
    .post(api, validate('json', edit.schema), async (c) => {
      const saved = await edit.save(adminCtx(c.env), null, c.req.valid('json') as TSave)
      return c.json(saved, 201)
    })
    .put(`${api}/:id`, validate('param', idParam), validate('json', edit.schema), async (c) => {
      const saved = await edit.save(adminCtx(c.env), c.req.valid('param').id, c.req.valid('json') as TSave)
      if (!saved) throw notFound()
      return c.json(saved)
    })
}
