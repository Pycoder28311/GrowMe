# Backend

Hono API on Cloudflare Workers with D1 (Drizzle), R2 and Better Auth.
Part of the root npm workspace: install from the repo root.

```
npm install                               # at the repo root
npm run dev --workspace backend           # http://localhost:8787
npm run typecheck --workspace backend
npm run deploy --workspace backend
npm run cf-typegen --workspace backend    # after changing wrangler.jsonc or .dev.vars
```

- Setting up a project or a new machine: [`instructions/backend-setup.md`](../instructions/backend-setup.md)
- Adding a table and its API: [`instructions/adding-a-resource.md`](../instructions/adding-a-resource.md)
- Request/response contracts shared with the app: [`packages/shared`](../packages/shared/src)
