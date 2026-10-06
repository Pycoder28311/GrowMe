# 02 — Admin dashboard: plants list and plant form

**Goal:** on `admin.testingggg.lol` (behind Cloudflare Access, never in the app), the dashboard cards
open a page per object type. The **Plants** page has a list, a **Δημιουργία** button and an edit page.
The form looks like the app's plant page (`app/src/app/(app)/plants/[id].tsx`), but every field is an
input. It includes photos, lifecycles and tips (both sortable by drag and drop) and diseases, and
everything is written with one **Αποθήκευση**. The form pieces are generic so that blogs, combinations
and others get their pages later from a short config.

**Depends on:** plan 01 (crud, shared package, errors) and the admin app that already exists
(`backend/src/resources/admin/`).
**Blocks:** later admin pages (blogs, combinations, posts moderation).

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Server-rendered pages with Hono JSX, like `admin.page.tsx`. They live only in the admin app, which is served only on `ADMIN_HOST` behind Access. No new project or build tool | User |
| D2 | The form edits **only the columns that exist in the DB**. The page-only texts (pot size, "how it grows", native to, climate, related plants) are left out | User |
| D3 | Images uploaded by the admin have **no owner**: a migration makes `images.user_id` nullable. Uploads go through a new admin route that reuses the existing upload checks | User |
| D4 | **One Save** sends the plant together with its lifecycles, tips, diseases and image order. The server writes it in one D1 batch | User |
| D5 | The Plants page also has edit and delete (delete asks for confirmation) | User |
| D6 | Diseases are in the form as a list (add/remove, not sortable: they have no position) | User |
| D7 | Drag and drop comes from our own small browser script served by the Worker: native HTML drag for the mouse, plus ↑/↓ buttons for touch and keyboard. No CDN | User |
| D8 | A migration adds `lifecycles.position` (needed for ordering). Existing rows get `position = id`, which keeps today's order | Default (required) |
| D9 | Price is typed in **euros** (e.g. `3.50`) and stored in **cents**, as the schema says | Default |
| D10 | The browser sends JSON (`fetch`). The server validates it with a shared zod schema. Validation errors (`details[].path`) are shown under the matching input | Default |
| D11 | A strict **Content-Security-Policy** on admin pages: scripts only from the same domain, styles inline plus Google Fonts, images from `IMAGES_URL` | Default |
| D12 | Reusable layer: field components plus a list/form "resource" config. Plants is the first user of it | Default (user: "reusable") |
| D13 | The public `/api/plants`, `/api/lifecycles` and `/api/tips` routes stay. Lifecycles gain `position` in their create/update schemas and are ordered by it, like tips | Default |

## 1 — Risks and blockers

1. **Remote D1 is behind.** Migration `0005` (plants etc.) was never applied remotely. The deployed
   dashboard home already counts `plants`, so it will error until `0005` is applied. Before deploying
   this plan, apply `0005` and the new `0006` with `--remote`. This needs the user's approval
   (task 12).
2. **Nullable `images.user_id`.** SQLite can't change a column's nullability in place, so drizzle-kit
   rebuilds the table (copy → drop → rename). Read the generated SQL before applying it. The `note_images`,
   `post_images`, `blog_images` and `plant_images` foreign keys must survive the rebuild. D1 runs
   migrations with foreign keys deferred; check this locally with real rows first.
3. **Ownership checks must not treat `null` as "anyone's".** `assertCanLinkImages` / `ownsAll` use
   `eq(owner, userId)`. That never matches `NULL`, so users still can't link admin images. Admin saves
   accept **only** images with `user_id IS NULL`, so the admin can't steal user photos either.
4. **Browser testing locally.** Access needs a signed token header that a browser won't send. The
   plan uses a small scratchpad proxy that adds a token from a fake Access (the same approach as the
   earlier admin tests). No bypass is added to the code, so the admin app still fails closed.

## 2 — Architecture

```
backend/src/resources/admin/
├── admin.app.tsx          CHG  mounts pages + /api/admin/* ; CSP header ; serves /admin.js
├── admin.page.tsx         CHG  home: cards become links (Plants active, others "σύντομα")
├── admin.repo.ts               unchanged (tableCounts)
├── ui/                    NEW  reusable, nothing plant-specific
│   ├── layout.tsx              <AdminLayout title>: head, fonts, CSS tokens, header, back link
│   ├── styles.ts               CSS from the app theme (colors/space/radius/fontSize as tokens)
│   ├── fields.tsx              TextField, TextArea, NumberField, MoneyField, Toggle, Select,
│   │                           RangeField (min–max), MonthRange, DifficultyField (1–5)
│   ├── repeatable-list.tsx     <RepeatableList name sortable itemFields>  (+ <template> for new rows)
│   ├── image-picker.tsx        upload, thumbnails, drag order, remove
│   ├── list-page.tsx           <ListPage> cards/table, "Δημιουργία" button, cursor "Περισσότερα"
│   └── form-page.tsx           <FormPage> sticky Save / Delete bar, error banner
├── admin.client.js        NEW  browser script (plain JS, served as /admin.js)
├── resource.ts            NEW  adminResource(config) → Hono router: list, new, edit pages + JSON API
└── plants/                NEW  the first resource
    ├── plants.admin.tsx        config: list columns + the form layout (looks like the app page)
    └── plants.save.ts          savePlant(): one batch for plant + children + image links
packages/shared/src/plants.ts  CHG  plantSave schema (admin), lifecycle position
backend/src/resources/images/  CHG  storeImages() shared by user + admin uploads; owner-aware checks
backend/drizzle/0006_*.sql     NEW  lifecycles.position, images.user_id nullable
```

Request flow (all on `ADMIN_HOST`, after `csrf` + `requireAccess` + `no-store`, which already exist):

```
GET  /                       home (counts → links)
GET  /plants?cursor=         list page              ─┐ adminResource(plantsAdmin)
GET  /plants/new             empty form              │
GET  /plants/:id             filled form             │
POST /api/admin/plants       create  (JSON)          │ validate(plantSave) → savePlant()
PUT  /api/admin/plants/:id   replace (JSON)          │
DELETE /api/admin/plants/:id delete                 ─┘ plantsRepo.remove logic
POST /api/admin/images       multipart upload → [{ id, url }]   (owner = null)
GET  /admin.js               the client script (cache: 1 day, versioned ?v=<hash>)
```

## 3 — Database (migration 0006)

- `schema.ts`:
  - `lifecycles`: add `position: integer('position').notNull().default(0)` and the index
    `(plant_id, position)`, like `tips`.
  - `images.userId`: use a nullable owner reference (new `optionalOwner()` helper next to `owner()`)
    with the comment `null = uploaded by the admin`.
- `npx drizzle-kit generate`, then append `UPDATE lifecycles SET position = id;` by hand to the SQL.
- Apply `--local`, check the counts and foreign keys, and do `--remote` only with the user's approval
  (task 12).

## 4 — Shared schema (`packages/shared/src/plants.ts`)

- `lifecycleCreate`/`lifecycleUpdate`: add `position` (same as tips). `Lifecycle` type gets `position`.
- New **admin save schema**, which reuses `plantFields`:

```ts
const childId = entityId.optional()            // present = existing row, absent = new row
export const plantSave = plantFields.extend({
  lifecycles: z.array(z.object({ id: childId, title, content: text })).max(50),
  tips:       z.array(z.object({ id: childId, title, content: text })).max(50),
  diseases:   z.array(z.object({ id: childId, title, label: label.nullable(), content: text })).max(50),
}).refine(rangesInOrder, rangeMessage)
export type PlantSave = z.infer<typeof plantSave>
```

  The array order is the position. Months must be both set or both empty (one more refine).

## 5 — Images (`backend/src/resources/images/`)

- Move the body of today's `POST /` into `storeImages(env, files, ownerId: string | null)` in
  `images.repo.ts`. It keeps the same limits (10 files, 10 MB, sniffed type, immutable cache). The user
  route calls it with `user.id` and behaves exactly as before.
- `assertCanLinkImages(ctx, ids, alreadyLinked)` stays for users. Add
  `assertAdminImages(db, ids, alreadyLinked)`, which accepts only ids where `user_id IS NULL`.
  `ownsAll` gets an owner condition parameter instead of a fixed `eq`.
- Unused uploads: when a form is left without saving, the uploaded images have no links. A later
  clean-up job can delete images that are older than a day and linked to nothing. This plan doesn't
  build that job (see Open items).

## 6 — Saving (`plants/plants.save.ts`)

`savePlant(db, env, id | null, input: PlantSave)`:

1. `assertExists` for `combinationId` and `assertAdminImages` for `imageIds`.
2. **Create:** insert the plant and get its id back. Then run one `runBatch` with the children inserts
   (`position = index`) and `replaceLinks(plantImageLinks, …)`. If the batch fails, delete the plant so
   no half-saved plant remains, then rethrow.
3. **Update:** load the existing child ids. A child id that doesn't belong to this plant →
   `400 UNKNOWN_REFERENCE` at `lifecycles.3.id`. Then one `runBatch`:
   - update the plant;
   - for each child table, delete the rows missing from the list, update the rows with an id
     (title/content/position), and insert the rows without an id;
   - `replaceLinks` for the images.

   After the batch, `deleteImages` for the images that were removed.
4. Return the full `Plant` (via the existing `find` in `plants.repo.ts`, exported).

The child-table part is written once as `syncChildren(db, table, parentCol, parentId, rows, toRow)`
in `lib/relations.ts`. It returns statements (it doesn't run them), like `replaceLinks`. Blogs and
others reuse it later.

Delete reuses `plantsRepo.remove`, called with an admin context. Its children cascade, and its images
are deleted from R2.

## 7 — Reusable admin UI (`resources/admin/ui/`)

- **Styles:** CSS custom properties copied from the app theme: `colors.ts` values, the 3 font sizes,
  `space`, `radius`, the card shadow and the Source Sans 3 font. `admin.page.tsx`'s local `COLORS`
  moves here. Inputs look like the app's text: a borderless input on a card, with a soft bottom
  outline on focus.
- **Fields** (`fields.tsx`): every field takes `name` (dot path, e.g. `priceMin`, `tips.0.title`),
  `label`, `value` and `hint`. Each renders a `<label>`, the input and an empty `<p data-error-for=name>`
  slot. `MoneyField` shows euros and has `data-cents` so the script converts. `Toggle` is a styled
  checkbox. `Select` takes `options`, used for `combinationId` (loaded from `combinations`).
- **`RepeatableList`:** `<ol data-list=name data-sortable>` items, each with a drag handle, ↑/↓
  buttons, remove ✕ and the item's fields, plus a `<template>` used by "+ Προσθήκη". Each row keeps
  its `id` in a hidden input.
- **`ImagePicker`:** file input (multiple). Thumbnails sort the same way as a RepeatableList (the
  same script code) and keep the image id in a hidden input.
- **`ListPage` / `FormPage`:** the page frames. `FormPage` has a sticky bottom bar with Αποθήκευση
  (primary) and Διαγραφή (accent outline, edit only), an error banner, and a "Αποθηκεύτηκε" toast.
- **`adminResource(config)`** (`resource.ts`) builds the 6 routes in §2 from:

```ts
type AdminResource<TItem, TSave> = {
  path: 'plants'; title: 'Φυτά'; singular: 'Φυτό'
  list: (db, env, cursor) => Promise<Page<TItem>>      // reuses the public repo's list
  get: (db, env, id) => Promise<TItem | null>
  schema: ZodType<TSave>
  save: (db, env, id: number | null, input: TSave) => Promise<{ id: number }>
  remove: (db, env, id) => Promise<boolean>
  ListItem: (p: { item: TItem }) => JSX.Element
  Form: (p: { item: TItem | null; options: … }) => JSX.Element
}
```

  A new object type then needs only a config file plus one line in `admin.app.tsx`.

## 8 — The plant form (`plants/plants.admin.tsx`)

Laid out top to bottom like the app's plant page:

| App page part | Form |
|---|---|
| `PlantGallery` | `ImagePicker` at the top (wide, rounded, like the gallery) |
| Name (big) + price (accent, right) | `TextField name` in the big font + `MoneyField priceMin/priceMax` on the right |
| Scientific name (small, muted) | `TextField scientificName`, small |
| `PlantFacts` card | Card with: sunlight `RangeField` (0–24 h) ☀️, difficulty 1–5 🌱, Toggles 🍅 food / 🌰 seeds / 📍 native, season `MonthRange` (Greek month names) |
| `LifeCycleCard` | "Κύκλος ζωής" card → sortable `RepeatableList lifecycles` (title + content) |
| Συμβουλές | sortable `RepeatableList tips` (title + content) |
| Ασθένειες | `RepeatableList diseases` (title, label, content) |
| Περιγραφή | `TextArea description` |
| Συνδυασμοί | `Select combinationId` (none + list) |

The list page shows a card per plant: first photo, name, scientific name, price range and difficulty.
It has a "Δημιουργία" button at the top right.

## 9 — Browser script (`admin.client.js`)

The file is plain JS with no build step. It is loaded as text through a wrangler `rules` entry
(`{ "type": "Text", "globs": ["**/*.client.js"] }`) and a `declare module '*.client.js'` type. It is
served at `/admin.js`. What it does:

- **Sorting:** handles `[data-sortable]` lists with `dragstart`/`dragover`/`drop`. A row moves only
  when it's grabbed by its handle. The ↑/↓ buttons move a row for touch and keyboard users and keep
  the focus on it.
- **Lists:** "+ Προσθήκη" clones the `<template>`; ✕ removes a row (if the row was already saved, its
  removal takes effect on Save).
- **Images:** uploads selected files to `/api/admin/images` and adds the thumbnails. A failed file
  shows its error message.
- **Save:** collects the form into the `PlantSave` shape: dot paths, numbers, euros → cents, and empty
  inputs → `null`. It sends `POST` or `PUT` and, on success, goes to the edit page. On a 400 it puts each
  `details[].message` under its input, scrolls to the first one, and leaves the inputs as they are.
- **Delete:** asks for confirmation, sends `DELETE`, then goes back to the list.
- **Leaving with unsaved changes:** a `beforeunload` warning.

## Testing

- `npm run typecheck --workspace backend`, `tsc` for `packages/shared`, `wrangler deploy --dry-run`.
- **Local E2E** against `wrangler dev --local-upstream` with a fake Access server (scratchpad):
  - no token → 403 on pages and on `/api/admin/*`;
  - create a plant with 3 lifecycles, 2 tips, 1 disease and 2 images → `GET /api/plants/:id` returns
    them in that order, with positions 0..n;
  - update: reorder, edit, remove a child and add a new one → the result matches; a removed image is
    gone from R2;
  - a child id that belongs to another plant → 400 with its path; `priceMin > priceMax` → 400;
  - a user's image id in `imageIds` → 400; and an admin image id sent to the user `/api/notes` → 400;
  - delete → the plant, its children and its images are gone;
  - a cross-site `POST` (multipart) → 403 (csrf);
  - user uploads and notes still work as before (the existing E2E script).
- **Browser check:** a scratchpad proxy adds the fake token. Then check by hand at phone and desktop
  widths: mouse drag, the ↑/↓ buttons, a validation error shown under its input, the toast, and that
  the CSP blocks nothing.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Schema changes + migration 0006 (+ hand-written UPDATE), applied locally | `backend/src/db/schema.ts`, `backend/drizzle/0006_*` |
| 2 | Lifecycle `position` in the shared schema, repo ordering and inserts | `packages/shared/src/plants.ts`, `resources/lifecycles/lifecycles.repo.ts`, `resources/plants/plants.repo.ts` |
| 3 | `plantSave` schema + type | `packages/shared/src/plants.ts` |
| 4 | `storeImages()`, owner-aware `ownsAll`, `assertAdminImages` | `resources/images/*`, `lib/relations.ts` |
| 5 | `syncChildren()` helper | `lib/relations.ts` |
| 6 | `savePlant()` (create + update) | `resources/admin/plants/plants.save.ts` |
| 7 | UI layer: styles, layout, fields, RepeatableList, ImagePicker, ListPage, FormPage | `resources/admin/ui/*` |
| 8 | `adminResource()` router + admin image upload route + `/admin.js` + CSP | `resources/admin/resource.ts`, `admin.app.tsx`, `wrangler.jsonc` (rules) |
| 9 | Browser script | `resources/admin/admin.client.js` |
| 10 | Plants config: list card + form layout | `resources/admin/plants/plants.admin.tsx` |
| 11 | Home cards → links | `resources/admin/admin.page.tsx` |
| 12 | Tests (E2E + browser), docs: a "adding an admin page" section | scratchpad, `instructions/adding-a-resource.md` |
| 13 | **With the user's approval:** apply 0005 + 0006 remotely, then commit/push | — |

Files **not** touched: anything in `app/` (the dashboard is not in the app), `Experiments/`,
`TakeTheTrip`, the Access middleware's fail-closed checks, and secrets / `.dev.vars`.

## Open items

- A clean-up job for images that were uploaded but never saved (a Cron Trigger once a day)? Default:
  later.
- Should creating combinations be possible from inside the plant form, or only on their own future
  page? Default: only their own page; the plant form just picks one.
