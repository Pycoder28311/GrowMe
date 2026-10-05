# Adding a resource (table + API) to the backend

How to add a new database table and its API to `backend/`, using the shared
CRUD and relationship helpers. Follow these steps for every new table.

## How the backend is organized

```
backend/src/
├── lib/                     shared code: knows nothing about specific tables
│   ├── crud.ts              crudRoutes(): turns a repo into 5 signed-in-only HTTP routes
│   ├── relations.ts         many-to-many helpers: replaceLinks(), removedIds(), ownsAll()
│   ├── errors.ts            HttpError: throw anywhere to answer with a clean JSON error
│   └── ...                  email, image-type, origins
├── resources/               one folder per resource
│   └── <name>/
│       ├── <name>.schema.ts what clients may send (zod)
│       ├── <name>.repo.ts   data logic (queries, ownership, relations)
│       └── <name>.routes.ts the HTTP routes (usually one line)
├── db/schema.ts             all tables (Drizzle)
├── middleware/              auth (requireAuth), csrf, rate-limit
└── index.ts                 mounts every resource under /api/<name>
```

`crudRoutes()` provides, for every resource:

| Route | Does |
|---|---|
| `GET /api/<name>` | list the signed-in user's rows |
| `GET /api/<name>/:id` | one row, or 404 |
| `POST /api/<name>` | create (validated), returns 201 |
| `PATCH /api/<name>/:id` | update (validated), or 404 |
| `DELETE /api/<name>/:id` | delete, returns 204, or 404 |

Authentication, input validation, 404s and status codes are handled there.
CSRF protection and rate limiting apply automatically to everything under `/api`.

## Steps

The example adds `tasks`: each user's to-do items.

### 1. Define the table in `backend/src/db/schema.ts`

```ts
export const tasks = sqliteTable(
    'tasks',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        done: integer('done', { mode: 'boolean' }).notNull().default(false),
        createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    },
    (t) => [index('tasks_user_id_idx').on(t.userId)],
)
```

Every table that belongs to a user gets a `userId` column and an index on it.

### 2. Create and apply the migration (in `backend/`)

```
npx drizzle-kit generate
npx wrangler d1 migrations apply growme-db --local
npx wrangler d1 migrations apply growme-db --remote
```

Read the generated SQL in `drizzle/` before applying it remotely. Adding a required
(`notNull`) column to a table that already has rows fails unless the column has a default.

### 3. Create `backend/src/resources/tasks/`

**`tasks.schema.ts`**: the fields a client may send. Never include `userId`, `id` or
other server-controlled fields here.

```ts
import { z } from 'zod'

export const taskCreate = z.object({
  title: z.string().trim().min(1).max(200),
})

/** Every field optional: send only what changes */
export const taskUpdate = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
})

export type TaskCreate = z.infer<typeof taskCreate>
export type TaskUpdate = z.infer<typeof taskUpdate>
```

**`tasks.repo.ts`**: every query filters by `ctx.userId`.

```ts
import { and, desc, eq } from 'drizzle-orm'
import { tasks } from '../../db/schema'
import type { Ctx, Repo } from '../../lib/crud'
import type { TaskCreate, TaskUpdate } from './tasks.schema'

type Task = typeof tasks.$inferSelect

const toJson = (t: Task) => ({ id: t.id, title: t.title, done: t.done })
export type TaskJson = ReturnType<typeof toJson>

/** Only rows owned by the signed-in user */
const mine = (ctx: Ctx, id: number) => and(eq(tasks.id, id), eq(tasks.userId, ctx.userId))

export const tasksRepo: Repo<TaskCreate, TaskUpdate, TaskJson> = {
  async list(ctx) {
    const rows = await ctx.db.select().from(tasks).where(eq(tasks.userId, ctx.userId)).orderBy(desc(tasks.id))
    return rows.map(toJson)
  },
  async get(ctx, id) {
    const row = await ctx.db.select().from(tasks).where(mine(ctx, id)).get()
    return row ? toJson(row) : null
  },
  async create(ctx, input) {
    const row = await ctx.db.insert(tasks).values({ ...input, userId: ctx.userId }).returning().get()
    return toJson(row)
  },
  async update(ctx, id, input) {
    const row = await ctx.db.update(tasks).set(input).where(mine(ctx, id)).returning().get()
    return row ? toJson(row) : null
  },
  async remove(ctx, id) {
    const row = await ctx.db.delete(tasks).where(mine(ctx, id)).returning().get()
    return !!row
  },
}
```

**`tasks.routes.ts`**:

```ts
import { crudRoutes } from '../../lib/crud'
import { tasksRepo } from './tasks.repo'
import { taskCreate, taskUpdate } from './tasks.schema'

export default crudRoutes({ create: taskCreate, update: taskUpdate, repo: tasksRepo })
```

### 4. Mount it in `backend/src/index.ts`

```ts
import tasksRoutes from './resources/tasks/tasks.routes'

const routes = app
  .route('/api/notes', notesRoutes)
  .route('/api/images', imagesRoutes)
  .route('/api/tasks', tasksRoutes)
```

### 5. Check and deploy (in `backend/`)

```
npx tsc --noEmit
npm run deploy
```

### 6. Use it in the app

Add `app/src/api/tasks.ts` with `list`, `create`, `update` and `remove`, following
`app/src/api/notes.ts`, then build the screens under `app/src/app/(app)/`.

## Relationships

### One-to-many (e.g. a project has many tasks)

Add a column that points to the parent and filter by it in the repo. No helper is needed.

```ts
projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
```

Before saving, check that the parent belongs to the user, e.g. with
`ownsAll(ctx.db, projects, { id: projects.id, owner: projects.userId }, [projectId], ctx.userId)`.

### Many-to-many (e.g. tasks ↔ tags)

1. Add a link table in `schema.ts` (see `noteImages`): two foreign keys with
   `onDelete: 'cascade'`, a composite primary key and, if order matters, a `position` column.
   Add Drizzle `relations()` for both tables so queries can load linked rows with `with`.
2. In the repo, describe the link once:

   ```ts
   const taskTagLinks: LinkTable<typeof taskTags> = {
     table: taskTags,
     parent: taskTags.taskId,
     toRow: (taskId, tagId, position) => ({ taskId, tagId, position }),
   }
   ```

3. When saving, check ownership of the linked ids, then replace the links in the same batch as the
   parent's own update:

   ```ts
   if (!(await ownsAll(ctx.db, tags, { id: tags.id, owner: tags.userId }, tagIds, ctx.userId))) {
     throw new HttpError(400, 'Unknown tag')
   }
   await ctx.db.batch([
     ctx.db.update(tasks).set({ title }).where(eq(tasks.id, id)),
     ...replaceLinks(ctx.db, taskTagLinks, id, tagIds),
   ])
   ```

4. Use `removedIds(before, after)` if unlinked rows need cleanup (as notes do with images).

`resources/notes/notes.repo.ts` is a complete working example of this pattern.

## Routes that are not plain CRUD

For uploads, actions or read-only endpoints, write a normal Hono router in
`resources/<name>/<name>.routes.ts` that starts with `.use(requireAuth)`, and mount it the same way.
`resources/images/images.routes.ts` (file upload) is an example.

## Rules

- **The owner comes from the session.** Use `ctx.userId` (or `c.get('user').id`). Never accept
  `userId` from the request body.
- **Every query on user data filters by owner.** Someone else's row must behave exactly like a
  missing row (404).
- **Validate every input with zod**, with limits (lengths, array sizes).
- **Return data through `toJson`.** Never send raw database rows to clients.
- **Check ownership of every linked id** (`ownsAll`) before creating links.
- **Group related writes in `db.batch()`** so they succeed or fail together.
- **Throw `HttpError(status, message)` for expected failures.** Unexpected errors are logged and
  answered with a generic 500.
- **Migrations:** apply every new migration with both `--local` and `--remote`, and commit the
  `drizzle/` folder.
- **After changing `wrangler.jsonc` or `.dev.vars`,** run `npm run cf-typegen`.

## Checklist

- [ ] Table in `db/schema.ts` (with `userId` and an index if user-owned)
- [ ] Migration generated, checked, applied locally and remotely
- [ ] `resources/<name>/` with `schema.ts`, `repo.ts`, `routes.ts`
- [ ] Mounted in `index.ts`
- [ ] `npx tsc --noEmit` passes
- [ ] Deployed
- [ ] App API file and screens
