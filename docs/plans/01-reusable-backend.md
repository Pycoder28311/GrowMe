# 01 — Reusable, fast backend structure

**Goal:** turn `backend/` into a structure that can be copied unchanged into any Hono + Drizzle +
Better Auth + Cloudflare project. Shared code (`lib/`, `middleware/`) contains nothing GrowMe-specific,
all project settings come from validated configuration, resources declare who may read and write them,
lists are paginated, every error has one shape, and request/response types live in a shared workspace
package (`packages/shared`). The Expo app keeps working unchanged.

**Covers:** items 1, 2, 3, 4, 6 and 7 (option B) from the reusability review.
**Depends on:** nothing. **Blocks:** a later plan for the app to adopt `packages/shared` and pagination,
and a later plan for automated tests (item 5).

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Plans live in `docs/plans/` | User |
| D2 | npm workspaces at the repo root with `backend` and `packages/*`. **`app/` is not a workspace member** and keeps its own lockfile | User |
| D3 | Add Better Auth's **admin plugin** (role + ban fields) and a `requireRole()` middleware | User |
| D4 | Rename bindings to generic names: D1 `growme_db` → `DB`, R2 `images` → `BUCKET`. The database, bucket and data stay the same | User |
| D5 | One error shape everywhere: `{ code, message, details? }`. This is **Better Auth's own shape**, so the app's existing error display keeps working | Default |
| D6 | Keyset (cursor) pagination: `?limit=&cursor=`, newest first by `id`, default 20, max 100, response `{ items, nextCursor }` | Default |
| D7 | Pagination is a per-resource option. **Notes stay unpaginated** (plain array) until the app plan switches them; every new resource is paginated | Default (app must not break) |
| D8 | Four access modes for `crudRoutes`: `owner`, `public-owner`, `public-admin`, `admin` | Default |
| D9 | Env is validated with zod once per isolate (cached), with a clear error listing missing names | Default |
| D10 | `packages/shared` ships TypeScript source (no build step); Wrangler/esbuild bundles it | Default |
| D11 | Split code into **core** (identical in every project) and **project** (GrowMe-specific) | Default |

## 1 — Risks and blockers

1. **Cloudflare Workers Builds will break** after D2. Its root directory is currently `backend`, so it
   installs only `backend/` and can't see `packages/shared`. Before the first push, the user must change
   the Worker's build settings: **root directory = repo root**, deploy command
   `npm run deploy --workspace backend`. Plan task 2 covers this; it can't be done from code.
2. **Lockfiles move.** `backend/package-lock.json` is replaced by a root `package-lock.json`. Check that
   `npm install` inside `app/` still uses `app/package-lock.json` (app isn't a member, so npm should treat
   it as standalone). Verify before committing.
3. **Admin plugin migration** adds columns to `user` and `session`. Generate it and read the SQL; apply
   with `--local` first, then `--remote`. Existing users get role `user`. The developer's own account must
   be promoted by an SQL command (task 12).
4. **Role changes reach sessions after up to 5 minutes** because of `session.cookieCache` (maxAge 5 min).
   Acceptable; documented.
5. **Error shape change** (D5): today some routes answer `{ error: '...' }`. The app only reads
   `res.status` for notes (`app/src/api/notes.ts`), and the auth screens read `error.message`/`error.code`
   from Better Auth, which already uses D5's shape. So nothing in the app breaks, but **verify** with the
   app after deploy.
6. **New config variables** (`APP_NAME`, `APP_SCHEME`, `WEB_ORIGINS`) must exist in `wrangler.jsonc`
   `vars` and in `backend/.dev.vars`, or env validation will refuse requests by design. Secrets are not
   touched; only new non-secret names are added.

## 2 — Architecture

```
GrowMe/
├── package.json                 NEW  workspaces: ["backend", "packages/*"] (app excluded)
├── package-lock.json            NEW  (replaces backend/package-lock.json)
├── packages/shared/             NEW  types + zod schemas used by backend (and later the app)
│   └── src/ errors.ts · pagination.ts · notes.ts · index.ts
├── backend/src/
│   ├── lib/                     CORE: identical in every project
│   │   ├── env.ts               NEW  zod env schema + getEnv() (cached)
│   │   ├── config.ts            NEW  AppConfig from env (name, scheme, origins…)
│   │   ├── errors.ts            CHG  HttpError(status, code, message, details) + helpers
│   │   ├── validate.ts          NEW  validate(target, schema): zValidator with D5 errors
│   │   ├── pagination.ts        NEW  page query schema, keyset helper
│   │   ├── crud.ts              CHG  access modes + optional pagination
│   │   ├── relations.ts              unchanged
│   │   ├── email.ts, image-type.ts   unchanged
│   │   └── origins.ts           DEL  replaced by config.webOrigins
│   ├── middleware/              CORE
│   │   ├── auth.ts              CHG  optionalAuth, requireAuth, requireRole
│   │   ├── csrf.ts, rate-limit.ts    CHG  use config + D5 errors
│   ├── auth.ts                  PROJECT  Better Auth options (emails use config.appName)
│   ├── emails.ts                NEW PROJECT  email texts (moved out of auth.ts)
│   ├── db/                      PROJECT  schema + getDb (env.DB)
│   ├── resources/               PROJECT  notes, images
│   └── index.ts                 PROJECT  mounts resources
```

Request flow (unchanged order, new pieces in bold):

```
request → **env check** → CORS(config.webOrigins) → CSRF → rate limit → route
        → **optionalAuth / requireAuth / requireRole** (per access mode)
        → **validate()** → repo (owner filter, **keyset page**) → toJson (**shared types**)
errors anywhere → HttpError / validation / Hono → **one shape {code, message, details?}**
```

## 3 — Shared workspace package (item 7, option B)

- **Root `package.json`:** `"private": true`, `"workspaces": ["backend", "packages/*"]`. Move install to
  the root (`npm install` at `GrowMe/`), delete `backend/package-lock.json`.
- **`packages/shared/package.json`:** name `@growme/shared` (see open items), `"type": "module"`,
  `"exports": { ".": "./src/index.ts" }`, peer dependency `zod`.
- **`packages/shared/src/errors.ts`:** `ERROR_CODES` constant (`UNAUTHORIZED`, `FORBIDDEN`,
  `FORBIDDEN_ORIGIN`, `NOT_FOUND`, `VALIDATION_FAILED`, `TOO_MANY_REQUESTS`, `INTERNAL`, plus resource
  codes like `UNKNOWN_IMAGE`) and `type ApiError = { code; message; details? }`.
- **`packages/shared/src/pagination.ts`:** `type Page<T> = { items: T[]; nextCursor: string | null }`
  and `pageQuery` zod schema (`limit`, `cursor`).
- **`packages/shared/src/notes.ts`:** move `noteInput` from `backend/src/resources/notes/notes.schema.ts`;
  add `type NoteImage`, `type Note`. `notes.repo.ts`'s `toJson` returns `Note`, so the compiler enforces
  the contract. Delete `notes.schema.ts` (or keep it as a one-line re-export; default: delete).
- **Rule:** shared contains only zod + types. No Drizzle, Cloudflare or Better Auth imports, so the app
  can import it later without pulling server code.

## 4 — One error format (item 4)

- **`lib/errors.ts`:** `class HttpError(status, code, message, details?)` plus small helpers
  `notFound()`, `forbidden()`, `unauthorized()`. Codes come from `@growme/shared`.
- **`lib/validate.ts`:** `validate(target, schema)` wraps `zValidator` with its error hook and answers
  `400 { code: 'VALIDATION_FAILED', message: 'Invalid input', details: [{ path, message }] }` instead
  of zod's raw object. `crud.ts` and `images.routes.ts` use it instead of `zValidator`.
- **`middleware/auth.ts`, `csrf.ts`, `rate-limit.ts`:** answer through the same shape (rate limit keeps
  `Retry-After`).
- **`index.ts`:** `app.onError` maps `HttpError`, `HTTPException` (wrapped into the shape) and unknown
  errors (`INTERNAL`, logged with `console.error`); add `app.notFound` → `NOT_FOUND`.
- **Repos:** `notes.repo.ts` throws `HttpError(400, 'UNKNOWN_IMAGE', ...)`; `crud.ts` uses `notFound()`.

## 5 — Configuration and env validation (items 1 and 6)

- **`lib/env.ts`:** zod schema for every variable the core needs:
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_NAME`, `WEB_ORIGINS` (comma list), optional
  `APP_SCHEME`, `EMAIL_FROM`, `RESEND_API_KEY`, `IMAGES_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  and the bindings `DB`, `BUCKET`, `AUTH_STRICT`, `API_GENERAL`. `getEnv(c.env)` parses once per isolate
  (cached in a `WeakMap`) and throws one error naming **all** missing or invalid variables (names only,
  never values).
- **First middleware in `index.ts`:** `app.use('*', checkEnv)`, so a misconfigured deploy fails loudly
  on the first request instead of mid-feature.
- **`lib/config.ts`:** `getConfig(env)` → `{ appName, appScheme, webOrigins, trustedOrigins, isDev }`.
  `trustedOrigins` = `${appScheme}://` (if set) + `webOrigins` + `exp://` only when `isDev`
  (`BETTER_AUTH_URL` starts with `http://localhost`). Cached like env.
- **`lib/origins.ts`:** deleted; `cors()` and `csrfProtection` read `config.webOrigins`
  (CORS uses Hono's `origin` callback so it can read per-request config).
- **`auth.ts`:** `trustedOrigins: config.trustedOrigins`; `expo()` is included only when `APP_SCHEME` is
  set (projects without a mobile app skip it); email bodies move to `src/emails.ts`
  (`resetPasswordEmail(config, url)` etc.) and use `config.appName` instead of "GrowMe".
- **`better-auth.config.ts`:** keep its plugin list in sync (`admin()` added).
- **`wrangler.jsonc` `vars`:** add `APP_NAME`, `APP_SCHEME` (`growme`), `WEB_ORIGINS` (empty for now);
  `backend/.dev.vars`: add `WEB_ORIGINS=http://localhost:8081`. Then `npm run cf-typegen`.

## 6 — Generic bindings (D4)

- `wrangler.jsonc`: D1 `"binding": "DB"`, R2 `"binding": "BUCKET"` (names, IDs and `migrations_dir`
  unchanged).
- Update `db/index.ts` (`env.DB`), `resources/images/images.repo.ts` and `images.routes.ts`
  (`env.BUCKET`), the local `/images/*` route in `index.ts`, and `instructions/adding-a-resource.md`.
- Local data in `backend/.wrangler/state` is keyed by database/bucket, not binding name, so it survives.
  Run `npm run cf-typegen` afterwards.

## 7 — Access modes and admin role (item 2)

- **Auth (`auth.ts`):** add `admin()` from `better-auth/plugins` (default role `user`, admin role
  `admin`). Regenerate `db/auth-schema.ts` with the Better Auth CLI (`better-auth.config.ts`), then
  `npx drizzle-kit generate` → new migration adding `role`, `banned`, `ban_reason`, `ban_expires`,
  `impersonated_by`.
- **`middleware/auth.ts`:**
  - `optionalAuth` sets `user`/`session` or `null` (no error) — for public reads.
  - `requireAuth` as today, but D5 error shape.
  - `requireRole(role)` → 403 `FORBIDDEN` unless `c.get('user').role === role`.
  - `AppEnv.Variables.user` becomes nullable for routes behind `optionalAuth`; the `Ctx` type in
    `crud.ts` gets `user: { id; role } | null` plus `userId` for owner routes.
- **`crudRoutes({ access, ... })`:**

  | Mode | GET list / one | POST / PATCH / DELETE | Example |
  |---|---|---|---|
  | `owner` | signed in, own rows only | signed in, own rows | notes (today's behavior) |
  | `public-owner` | everyone | signed in; PATCH/DELETE own rows only | posts |
  | `public-admin` | everyone | admin only | plants, blogs |
  | `admin` | admin only | admin only | moderation lists |

  Ownership filtering stays inside each repo (as today). `crudRoutes` only decides which middleware runs
  and what `Ctx` contains. Notes keep `access: 'owner'`.
- **Promote yourself:** after migrating, set your account's role with
  `npx wrangler d1 execute <db> --remote --command "UPDATE user SET role='admin' WHERE email='<your email>'"`.

## 8 — Pagination (item 3)

- **`lib/pagination.ts`:** `parsePage(query)` using `pageQuery` from shared; `keysetPage(rows, limit)`
  that takes `limit + 1` rows and returns `{ items, nextCursor }`. The cursor is the last row's `id`,
  base64-encoded (opaque to clients).
- **Repo contract:** `list(ctx, page)` returns `Page<T>` when the resource is paginated. Queries use
  `WHERE id < cursor ORDER BY id DESC LIMIT limit + 1`, served by the primary key, so **rows read ≈ page
  size**, regardless of table size.
- **`crudRoutes({ paginate })`:** default `true`; notes set `paginate: false` (D7). With `paginate`,
  `GET /` validates `?limit&cursor` and returns `Page<T>`.
- **Performance notes kept as rules in the docs:** index every filter column (owner, parent, foreign
  keys), use `db.batch()` for related writes, never `count(*)` per request (store counts), keep the
  cookie cache on.

## 9 — Documentation

- **`instructions/adding-a-resource.md`:** update for `access`, `paginate`, `validate()`, error codes,
  shared types (schemas move to `packages/shared`), generic bindings.
- **New `instructions/backend-setup.md`:** starting a new project from this structure: create D1 + R2,
  `wrangler.jsonc` (bindings, rate limiters, vars), `.dev.vars` names (never values), Better Auth tables
  + admin plugin, first admin, Resend + Google (optional), Workers Builds settings for the workspace,
  core vs project files.
- **`backend/README.md`:** replace the template text with a short pointer to both instructions.

## Testing

Automated tests are item 5 and a separate plan. Here, each task is verified by:

- `npx tsc --noEmit` in `backend/` (and `packages/shared`) after every task.
- `npx wrangler deploy --dry-run` to prove it still bundles (especially after the workspace move).
- A local scripted check against `npm run dev` with the local database, as done for the resource
  refactor: sign up via the email link, notes CRUD with images, fake upload (415), CSRF (403), no
  session (401), invalid input → `VALIDATION_FAILED` shape, unknown route → `NOT_FOUND`,
  `public-admin` resource writes as user (403) vs admin (200), pagination (`limit=2` → `nextCursor`,
  second page, last page `null`), missing `APP_NAME` → clear env error.
- After deploy: the Expo app (web + phone) — sign in (password, code, Google), notes with images,
  reset link — to confirm D5/D7 kept it unchanged.

Limits: emails are real during local tests (Resend quota); the strict rate limit (5/min) applies during
manual testing.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Root workspace + `packages/shared` skeleton; install at root; remove backend lockfile; verify `npm run dev`, dry-run and that `app/` installs standalone | `package.json`, `package-lock.json`, `packages/shared/*`, `backend/package-lock.json` |
| 2 | **User:** change Cloudflare Workers Builds root dir to repo root, deploy command `npm run deploy --workspace backend` | Cloudflare dashboard |
| 3 | Shared error codes, `ApiError`, `Page<T>`, `pageQuery` | `packages/shared/src/errors.ts`, `pagination.ts`, `index.ts` |
| 4 | Move notes schema + types to shared; type `toJson` as `Note` | `packages/shared/src/notes.ts`, `backend/src/resources/notes/*` |
| 5 | Unified errors: `HttpError` codes, `validate()`, `onError`, `notFound`, middleware responses | `backend/src/lib/errors.ts`, `lib/validate.ts`, `middleware/*.ts`, `index.ts`, `lib/crud.ts`, `resources/*` |
| 6 | Env schema + cached `getEnv`, `checkEnv` first middleware | `backend/src/lib/env.ts`, `index.ts` |
| 7 | `getConfig`; CORS/CSRF from config; delete `origins.ts`; new vars in `wrangler.jsonc` / `.dev.vars` names; `cf-typegen` | `lib/config.ts`, `index.ts`, `middleware/csrf.ts`, `wrangler.jsonc`, `.dev.vars`, `worker-configuration.d.ts` |
| 8 | Project/core split for auth: `emails.ts`, `trustedOrigins` from config, optional `expo()` | `backend/src/auth.ts`, `backend/src/emails.ts` |
| 9 | Generic bindings `DB`, `BUCKET` | `wrangler.jsonc`, `db/index.ts`, `resources/images/*`, `index.ts`, `worker-configuration.d.ts` |
| 10 | Admin plugin + regenerate auth schema + migration (local, then remote) | `auth.ts`, `better-auth.config.ts`, `db/auth-schema.ts`, `drizzle/00xx_*.sql` |
| 11 | `optionalAuth`, `requireRole`; nullable user in `Ctx`; `crudRoutes` access modes | `middleware/auth.ts`, `lib/crud.ts` |
| 12 | **User:** promote own account to admin (SQL command above) | remote D1 |
| 13 | Keyset pagination helper; `crudRoutes({ paginate })`; notes `paginate: false` | `lib/pagination.ts`, `lib/crud.ts`, `resources/notes/notes.routes.ts` |
| 14 | Docs: update `adding-a-resource.md`, add `backend-setup.md`, rewrite `backend/README.md` | `instructions/*`, `backend/README.md` |
| 15 | Full local check (Testing list), deploy, verify the app | — |

Files **not** touched: everything in `app/` (including `app/.env.local`, `app/eas.json`,
`app/package-lock.json`); secret values in `backend/.dev.vars` and Cloudflare secrets (only new
non-secret names are added); existing migrations in `backend/drizzle/` (only new ones are added);
`backend/src/db/auth-schema.ts` is changed only by the Better Auth CLI, never by hand.

## Open items

1. **Shared package name:** `@growme/shared`, or a project-neutral name (e.g. `@app/shared`) so the
   template needs no renaming? Default in this plan: `@growme/shared`.
2. **Production web origin:** `WEB_ORIGINS` stays empty in production until the web app has a domain
   (e.g. `https://app.testingggg.lol`).
3. **Page size:** default 20 / max 100 — change if the app needs other numbers.
4. **Expo Go in production:** `exp://` is trusted only when `isDev`. Testing Expo Go against the
   **production** backend would then fail; confirm that's acceptable (use preview builds instead).
