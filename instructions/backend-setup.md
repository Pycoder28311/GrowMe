# Backend setup (new project or new machine)

How to start a project from this backend structure (Hono + Drizzle + Better Auth on Cloudflare
Workers with D1 and R2), or set up an existing one on a new computer. To add tables afterwards, see
`adding-a-resource.md`.

## Core vs project files

Copy the **core** unchanged into a new project; rewrite the **project** files.

| Core (identical everywhere) | Project (per app) |
|---|---|
| `backend/src/lib/*` | `backend/src/db/schema.ts`, `db/auth-schema.ts` (generated) |
| `backend/src/middleware/*` | `backend/src/resources/*` |
| `backend/better-auth.config.ts` (keep in sync with `auth.ts`) | `backend/src/auth.ts` (sign-in methods) |
| root `package.json` (workspaces) | `backend/src/emails.ts` (email texts) |
| | `backend/src/index.ts` (mounted resources) |
| | `packages/shared/src/*` (contracts; keep `errors.ts`, `pagination.ts`) |
| | `backend/wrangler.jsonc` (names, IDs, vars) |

When starting a new project, rename `@growme/shared` (in `packages/shared/package.json`, the
backend dependency and all imports) to the new project's name.

## 1. Install

```
npm install            # at the repo root: installs app + backend + packages/shared together
```

There is one lockfile and one `node_modules` at the root. Each project keeps its own `package.json`.
A project only gets its own `node_modules` for packages whose version differs from the rest
(e.g. the app's TypeScript). Add packages from the project's folder (`npx expo install …` inside
`app/`, `npm install … --workspace backend` for the backend).

## 2. Cloudflare resources (in `backend/`)

```
npx wrangler login
npx wrangler d1 create <database-name>       # copy the database_id it prints
npx wrangler r2 bucket create <bucket-name>
```

## 3. `backend/wrangler.jsonc`

Binding names are fixed (`DB`, `BUCKET`, `AUTH_STRICT`, `API_GENERAL`): the core code uses them.

```jsonc
{
  "$schema": "../node_modules/wrangler/config-schema.json",
  "name": "<worker-name>",
  "main": "src/index.ts",
  "compatibility_date": "<today>",
  "d1_databases": [
    { "binding": "DB", "database_name": "<database-name>", "database_id": "<id>", "migrations_dir": "drizzle" }
  ],
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "<bucket-name>" }],
  "ratelimits": [
    { "name": "AUTH_STRICT", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } },
    { "name": "API_GENERAL", "namespace_id": "1002", "simple": { "limit": 120, "period": 60 } }
  ],
  "vars": {
    "APP_NAME": "<App name shown in emails>",
    "APP_SCHEME": "<mobile app scheme, or empty if there is no mobile app>",
    "WEB_ORIGINS": "<comma-separated production web origins, or empty>",
    "IMAGES_URL": "https://<images domain>",
    "BETTER_AUTH_URL": "https://<worker URL or api domain>",
    "EMAIL_FROM": "<App> <no-reply@<verified domain>>"
  }
}
```

## 4. Variables and secrets

Every variable is checked by `backend/src/lib/env.ts` on the first request. A missing one answers
`500 SERVER_MISCONFIGURED` and logs the variable's **name** (never its value).

| Name | Kind | Where |
|---|---|---|
| `APP_NAME`, `APP_SCHEME`, `WEB_ORIGINS`, `IMAGES_URL`, `BETTER_AUTH_URL`, `EMAIL_FROM` | plain vars | `wrangler.jsonc` `vars` |
| `BETTER_AUTH_SECRET` | secret | `npx wrangler secret put BETTER_AUTH_SECRET` (value: `openssl rand -base64 32`) |
| `RESEND_API_KEY` | secret | `npx wrangler secret put RESEND_API_KEY` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | secrets, optional | `npx wrangler secret put …`; Google sign-in is off without both |
| `GOOGLE_MAPS_API_KEY` | secret, optional | `npx wrangler secret put GOOGLE_MAPS_API_KEY`; names a user's area on the profile (Geocoding API, server only). Without it the phone's own name for the area is kept |
| `ADMIN_HOST`, `ADMIN_EMAILS`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | plain vars, optional | `wrangler.jsonc` `vars`; see 6b |

**Local development:** create `backend/.dev.vars` (ignored by Git). Values there override `vars`:

```
BETTER_AUTH_SECRET=<a different secret than production>
BETTER_AUTH_URL=http://localhost:8787
IMAGES_URL=http://localhost:8787/images
WEB_ORIGINS=http://localhost:8081
RESEND_API_KEY=<key>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
GOOGLE_MAPS_API_KEY=<optional>
```

With `BETTER_AUTH_URL` on localhost the backend treats itself as **development** and also trusts
Expo Go (`exp://`). In production Expo Go is not trusted; test phones with preview builds.

After changing `wrangler.jsonc` or `.dev.vars`: `npm run cf-typegen` (in `backend/`).

## 5. Database

```
npx @better-auth/cli generate --config better-auth.config.ts --output src/db/auth-schema.ts --yes
npx drizzle-kit generate
npx wrangler d1 migrations apply <database-name> --local
npx wrangler d1 migrations apply <database-name> --remote
```

`better-auth.config.ts` must list the same plugins as `src/auth.ts` (they decide the auth tables).

**First admin** (the admin plugin gives every user the role `user`):

```
npx wrangler d1 execute <database-name> --remote --command "UPDATE user SET role='admin' WHERE email='<your email>'"
```

Roles reach existing sessions within 5 minutes (session cookie cache), or immediately after
signing in again.

## 6. Optional services

- **Email (Resend):** verify the sending domain in Resend and add its DNS records (DKIM, SPF, MX on
  `send.`) plus one DMARC record (`_dmarc`: `v=DMARC1; p=none;`) in Cloudflare DNS.
- **Images domain:** connect a custom domain to the R2 bucket (R2 → bucket → Settings → Custom
  Domains), set `IMAGES_URL` to it.
- **Google sign-in:** create a **Web application** OAuth client; redirect URIs
  `https://<BETTER_AUTH_URL host>/api/auth/callback/google` and
  `http://localhost:8787/api/auth/callback/google`.

## 6b. Admin dashboard (optional, Cloudflare Access)

A private dashboard on its own domain (e.g. `admin.<domain>`), with no sign-in page of ours:
Cloudflare Access asks for the email (one-time code) before any request reaches the Worker.

1. Cloudflare One (Zero Trust, free plan): note the **team domain** (`https://<team>.cloudflareaccess.com`).
2. `wrangler.jsonc`: `"routes": [{ "pattern": "admin.<domain>", "custom_domain": true }]` and
   `"workers_dev": true` (keeps the API's workers.dev address). Deploy: Cloudflare creates the DNS
   record and certificate. Remove any wildcard `*` DNS record that would catch the subdomain.
3. Cloudflare One → Access controls → Applications → Add → Self-hosted: hostname `admin.<domain>`
   (empty path), a policy **Allow → Emails → <your email>**, session duration as wanted. Save.
4. Copy the application's **AUD tag** and set the vars: `ADMIN_HOST`, `ADMIN_EMAILS`,
   `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`.

How it is enforced (`middleware/access.ts`, `lib/access.ts`):

- Requests for `ADMIN_HOST` go to a separate app (`resources/admin/admin.app.tsx`); its routes
  exist on no other address.
- Every one must carry a valid `Cf-Access-Jwt-Assertion` token: signed by the team's keys, issuer =
  team domain, audience = AUD, not expired, email in `ADMIN_EMAILS`. Anything else is refused
  (403), and the admin part refuses everything while `ACCESS_AUD` is empty.
- Changes (POST/PATCH/DELETE) are accepted only from the admin domain itself (CSRF).
- Logout: `/cdn-cgi/access/logout` on the admin domain.

Locally there is no Access: run `wrangler dev --local-upstream localhost:8787` with `ADMIN_HOST=localhost`
and a test key server only for testing.

## 7. Run and deploy

```
npm run dev --workspace backend          # local, http://localhost:8787
npm run typecheck --workspace backend
npm run deploy --workspace backend       # manual deploy
```

**Automatic deploys (Cloudflare Workers Builds):** because the backend uses `packages/shared`,
the build must run from the repo root. In the Worker → Settings → Build: **root directory** = repo
root (`/`), **deploy command** = `npm run deploy --workspace backend`.

## 8. Security defaults included

CSRF protection (untrusted website origins are rejected), rate limits (strict on sign-in and email
actions), env validation, owner filtering in every repo, image signature checks, one error format.
For production web apps, put the app and API on the same domain (e.g. `app.` and `api.` of one
domain) so cookies work in every browser, and turn on Bot Fight Mode for that domain.
