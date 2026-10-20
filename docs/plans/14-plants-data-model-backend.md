# 14 — Plants data model and backend API

**Goal:**
- **Database:** `plants` gets the fields from `docs/ideas/newFieldPlants.md` and loses the ones you removed; `diseases` and `lifecycles` change shape; the tips tables go. One hand-written migration, `0017`, with no table rebuild and a data conversion for every changed column.
- **Shared:** `@growme/shared` holds every value list, label and helper for the new fields once (`plant-fields.ts`), and the zod schemas and types in `plants.ts` follow.
- **Backend:** the plants repo, public routes, dashboard save, search index and blog-link counter read and write the new shape. The edge cache and its purge keep working untouched: no new URL variants, filters stay on the phone.

**Depends on:** plan 13 (nothing in it touches plants data); remote migrations 0012–0016 applied before 0017 is applied remotely.
**Blocks:** the app plan for the new plant page and filters (it reads this API), and the dashboard-widgets plan (sun bars, pot sizes, season pickers).

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Dropped for good** (`DROP COLUMN`): `price_min`, `price_max`, `kind`, `size`, `lifespan` (text), old `wind`. The single lifespan text is converted to numbers first (D6) | User |
| D2 | **Ice, sea salt and wind become 3-level fields** instead of the booleans `frost_hardy`, `near_sea` and the old 4-value `wind`. Columns `frost_tolerance`, `salt_tolerance`, `wind_tolerance`, each `small \| medium \| big`, null = not set. The old wind is dropped and replaced, so its values are mapped (D7) | User |
| D3 | **Sunlight: 4 columns** `sun_intense_start/end` and `sun_soft_start/end`, whole hours 6–21, both-or-neither per bar, start < end. Existing `sun_start/end` is renamed to the intense bar; the soft bar starts empty | User |
| D4 | **Tips tables dropped** (`plant_tips`, then `tips`). `diseases` loses `content` and gets `symptoms` (Τι βλέπω), `what` (Τι είναι), `action` (Τι κάνω). Existing disease content is copied into `what` | User |
| D5 | **Multi-select fields are JSON text arrays:** `pot_sizes`, `difficulty_levels`, `time_needed`, `toxicity`. Values are fixed lists in shared, checked by zod. Filtering is on the phone, so no SQL filtering and no join tables | User |
| D6 | **Lifespan** becomes `lifespan_min` / `lifespan_max`, whole years (`null` both or neither, min ≤ max, 1–999). Conversion from the old text: years as written; months, weeks and days are converted and rounded, minimum 1 (a 6-month annual becomes 1) | Default |
| D7 | **Tolerance mapping** (levels mean how much the plant tolerates): old `wind` strong→big, moderate→medium, light→small, sheltered→small; `frost_hardy = 1` → `frost_tolerance = 'big'`; `near_sea = 1` → `salt_tolerance = 'big'`; everything else null. The page shows the row for `big` and `medium` only (a client matter) | Default |
| D8 | **Month ranges become named seasons:** the existing `monthRanges` (the planting season: the app's «Φύτεμα» filter reads it) is renamed `plantingSeason`; new `seedingSeason`. Each is up to 3 `[from, to]` ranges. Columns `month_start…` are renamed `planting_start…` with `RENAME COLUMN`, new `seeding_start…` are added | Default |
| D9 | **Difficulty** is the JSON array `difficulty_levels` (values `small \| medium \| big`; Greek easy/medium/hard labels in shared). The old integer `difficulty` column **stays**: it is `NOT NULL` with a CHECK, which blocks `DROP COLUMN` (see 0013) and a rebuild would delete child rows. The repo writes it as the hardest selected level (1–3, empty = 1); the API no longer shows it | Default |
| D10 | **New flags** (default false): `evergreen` (the `greenness` boolean: green the whole year) and `greenness` (Πρασινάδα). `food`, `climbing`, `aromatic`, `ornamental`, `succulent`, `smallTree`, `privacy`, `indoor`, `outdoor` stay as they are. `indoor`/`outdoor` are the `inside`/`outside` of your list | Default |
| D11 | **Usage list** (the exterior filter's 7 checkboxes) is a constant `PLANT_USAGE_FLAGS = [food, climbing, aromatic, ornamental, smallTree, greenness, succulent]` in shared, so the app and the dashboard read one list | Default |
| D12 | **`family`** is a nullable text. «Genus» is not a field (it is the first word of `scientificName`; the app can show it from there) | Default |
| D13 | **`trivia` and `secret`** («Ηξερες οτι», «Μυστικο επιτυχιας»): nullable plain texts, max 2000. They are in `Plant` (`GET /:id`) only, not in `PlantSummary` or the search index, so lists stay small | Default |
| D14 | **Lifecycle «additional tab» (περιποίηση):** `lifecycles.seed` (boolean) becomes `lifecycles.tab`, text `seed \| plant \| care`. Existing rows map `seed=1` → `seed`, else `plant`. The save rule: seed stages first, then plant stages, then care stages. `duration` is already optional | Default (ambiguous in the idea file, see Open items) |
| D15 | **Seasons are columns, not JSON,** and one table-driven helper reads and writes them (`SEASON_COLUMNS`), so a later flowering or fruiting season is 6 columns plus one line | Default |
| D16 | **`GET /api/plants` stays filterless** except `combinationId`. No new query parameters, so the cache keeps one URL per page | Default |

## 1 — Risks and blockers

1. **Hand-written migration, nothing is rebuilt.** drizzle-kit would rebuild `plants`, and on D1 dropping the old table deletes lifecycles, diseases and image links (see `adding-a-resource.md` and 0010/0013). Every step is `ADD`, `UPDATE`, `RENAME COLUMN` or `DROP COLUMN`.
   - `difficulty` (CHECK) and `month_start/month_end` (CHECK `plants_month_check`) are the two columns a CHECK touches. `difficulty` is kept (D9). The month columns are only **renamed**: SQLite rewrites the CHECK text on rename; verify on the local copy (Testing 1). If D1 refuses, fallback: keep the physical names `month_start…` and give the schema properties the new names.
   - `schema.ts` must be edited to match, including the CHECK's column names, and the `0017` snapshot written by hand (as 0013 did), otherwise the next `drizzle-kit generate` proposes a rebuild.
2. **Data that is lost on purpose:** every tip (D4), the price range, kind, size, and the exact wind text (mapped). Take a SQL backup before applying (like `backend/backup-before-0013.sql`), local and remote.
3. **Defaults after migration:** all new booleans (`evergreen`, `greenness`) are false and all new level/array/season fields are empty until an admin fills them in; every existing plant has no soft sun bar and no seeding season. Fill local plants before release; same on remote right after.
4. **The API shape changes and the current app build breaks:** `price*`, `kind`, `size`, `wind`, `frostHardy`, `nearSea`, `sunStart/sunEnd`, `lifespan`, `monthRanges`, `difficulty` (number) and `tips` disappear from `Plant`/`PlantSummary`/`SearchPlant`. **Do not deploy the backend or apply 0017 remotely until the app plan ships a new build.** Local only until then.
5. **App compile fallout** (not fixed here, the app plan does it): `app/src/api/plants.ts`, `lib/plants.ts`, `config/plant-filters.ts`, `plant-traits.ts`, `plant-tiles.ts`, `plant-icons.ts`, `mock-results.ts`, `components/plants/{plant-card,trait-rows,tips-list,lifecycle/lifecycle-card}.tsx`, `components/search/result-row.tsx`, `app/(app)/plants/[id]/index.tsx`. The app typechecks again only after its own plan.
6. **Raw SQL is not type-checked:** `linkedFromCount` in `backend/src/resources/blogs/blog-links.ts` queries `tips` and `diseases.content`; after 0017 it would throw at runtime when the dashboard shows a blog. It is in the task list.
7. **Edge cache after deploy:** answers cached before the deploy keep the old shape for up to `s-maxage` (1 h). Purge once right after deploying (§6).

## 2 — Approach

```
db/schema.ts ──migration 0017──> D1
      │ (property names = API names; JSON columns typed with the shared lists)
packages/shared/src/plant-fields.ts   value lists, labels, tiny helpers (no zod)
      │
      ├── plants.ts   zod (plantFields / plantCreate / plantUpdate / plantSave) + types
      ├── search.ts   PlantFilterFields picks the new fields
      │
backend/src/resources/plants/plants.columns.ts   rows <-> API (seasons, filter fields), one place
      ├── plants.repo.ts        public CRUD (list = summary, get = detail)
      ├── admin/plants/plants.save.ts   dashboard save (no tips any more)
      └── search/search.routes.ts       index (uses toFilterFields)
```

Rule kept from the existing code: a value list is written **once** in shared and imported by schema (`as const` copy only where drizzle-kit needs it standalone, as `WIND_LEVELS` is today), zod, labels and the app. Adding an option later never needs a migration (JSON columns, `text` enums have no CHECK).

## 3 — Database (`backend/src/db/schema.ts`, `backend/drizzle/0017_plant_fields_v2.sql`)

### `plants`

| Column | Change |
|---|---|
| `family` | ADD text, null |
| `lifespan_min`, `lifespan_max` | ADD integer, null (from the old `lifespan`, D6) |
| `sun_intense_start/end` | RENAME of `sun_start/end`, then clamp to 6–21 (set both null when the clamp leaves start ≥ end) |
| `sun_soft_start/end` | ADD integer, null |
| `planting_start/end`, `planting_start_2/end_2`, `planting_start_3/end_3` | RENAME of `month_*` |
| `seeding_start/end`, `…_2`, `…_3` | ADD integer, null |
| `pot_sizes`, `difficulty_levels`, `time_needed`, `toxicity` | ADD text NOT NULL DEFAULT `'[]'`, drizzle `text(…, { mode: 'json' }).$type<Array<…>>()` |
| `frost_tolerance`, `salt_tolerance`, `wind_tolerance` | ADD text, null (`text('…', { enum: TOLERANCE_LEVELS })`) |
| `evergreen`, `greenness` | ADD `flag(…)` (integer boolean NOT NULL DEFAULT 0) |
| `trivia`, `secret` | ADD text, null |
| `difficulty` | kept, derived (D9); `difficulty_levels` is filled from it |
| `price_min`, `price_max`, `kind`, `size`, `lifespan`, `wind`, `frost_hardy`, `near_sea` | DROP (after conversion) |

Constants `WIND_LEVELS`, `PLANT_KINDS`, `PLANT_SIZES` leave `schema.ts`; a `TOLERANCE_LEVELS = ['small','medium','big']` copy takes their place with the same comment ("repeated so drizzle-kit reads this file on its own").

### `lifecycles` and `diseases`

- `lifecycles`: ADD `tab` text NOT NULL DEFAULT `'plant'` (`enum: LIFECYCLE_TABS`); `UPDATE … SET tab='seed' WHERE seed=1`; DROP `seed`.
- `diseases`: ADD `symptoms`, `what`, `action` (text, null); `UPDATE diseases SET what = content`; DROP `content`.

### Dropped tables

`DROP TABLE plant_tips; DROP TABLE tips;` in that order. Remove `tips`, `plantTips`, their relations and `plantsRelations.tipLinks` from `schema.ts`.

### Migration order (one file, `--> statement-breakpoint` between statements)

1. header comment (why hand-written, as 0013)
2. `family`, `trivia`, `secret`, flags, JSON columns, tolerance columns, sun-soft, seeding columns (all `ADD`)
3. conversions with `UPDATE`:
   - `difficulty_levels` from `difficulty` (1→`["small"]`, 2→`["medium"]`, 3,4,5→`["big"]`)
   - lifespan text → min/max: split on the space, then on `-`, factor by unit (`years` 1, `months` 1/12, `weeks` 1/52, `days` 1/365), `max(1, round(n * factor))`, `lifespan_max = lifespan_min` when a single number
   - tolerance mapping (D7)
   - sun clamp to 6–21
   - `lifecycles.tab`, `diseases.what`
4. `RENAME COLUMN` for sun and months
5. `DROP COLUMN` for everything in the table above, `lifecycles.seed`, `diseases.content`
6. `DROP TABLE plant_tips`, `DROP TABLE tips`

## 4 — Shared (`packages/shared/src`)

### `plant-fields.ts`

- **Remove:** `WIND_LEVELS`, `WIND_LABELS`, `WIND_TOLERANT`, `PLANT_KINDS`, `PLANT_SIZES` (and their labels/types); `frostHardy` and `nearSea` from `PLANT_FLAGS`.
- **Add flags** `evergreen` («Μένει πράσινο όλο το χρόνο», yes only) and `greenness` («Πρασινάδα»); add `PLANT_USAGE_FLAGS` (D11).
- **Add one generic list shape** so every new list is a single table of `{ value, label }`, with a helper `values(list)` for zod and `labelOf(list, value)`; new lists:
  - `TOLERANCE_LEVELS` (small/medium/big)
  - `POT_SIZES` with the diameter in the entry: `small` <20 cm, `medium` 21–35, `big` 36–50, `large` >50
  - `EFFORT_LEVELS` (small/medium/big) used by `difficulty` (labels Εύκολο/Μέτριο/Δύσκολο) and `timeNeeded` (own labels), as two label maps over one value list
  - `TOXICITY` (`cat`, `dog`, `none`)
  - `LIFECYCLE_TABS` (`seed`, `plant`, `care`, label «Από σπόρο», «Μεταφύτευση», «Περιποίηση»)
- **Seasons:** replace `MAX_MONTH_RANGES` use with `SEASON_FIELDS = ['seedingSeason', 'plantingSeason'] as const`, `type SeasonField`, `type PlantSeasons = Record<SeasonField, MonthRange[]>`. `monthsOfRange` and `rangesCoverMonth` stay.
- **Sun:** `SUN_MIN_HOUR = 6`, `SUN_MAX_HOUR = 21`, `SunBar = { start: number; end: number } | null`, `sunBars(plant)` returning `{ intense, soft }` (null when not set). `sunLength` and `sunPart` stay and take one bar.
- **Lifespan:** `lifespanLabel(min, max)` → «4–6 χρόνια» / «2 χρόνια» / null. `parseDuration`/`durationLabel` stay for lifecycle durations.
- `flagDefault`/`visibleFlags`/`flagPhrase` need no change.

### `plants.ts`

- `plantFields`: drop `priceMin/priceMax`, `wind`, `kind`, `size`, `lifespan`, `difficulty`, `sunStart/sunEnd`, `monthRanges`; add
  - `family`, `trivia`, `secret` (nullable text)
  - `lifespanMin`, `lifespanMax`
  - `sunIntenseStart/End`, `sunSoftStart/End`
  - `seedingSeason`, `plantingSeason`
  - `potSizes`, `difficultyLevels`, `timeNeeded`, `toxicity`
  - `frostTolerance`, `saltTolerance`, `windTolerance`
  - flags come from `PLANT_FLAG_KEYS`, so `evergreen` and `greenness` need no extra code
- **New small builders** in the file, reused by all fields: `choices(list)` = `z.array(z.enum(values(list))).max(list.length)` with a unique check; `hourBar(prefix)` for the two sun bars (each pair both-or-neither, start < end, 6–21), replacing `sunInOrder`; `seasonRanges` = `z.array(z.tuple([month, month])).max(MAX_MONTH_RANGES)`; `yearRange` for lifespan (min ≤ max, both or neither). `toxicity` gets a check that `none` is not combined with `cat`/`dog`.
- **Defaults of `plantCreate`:** one `plantDefaults` constant holds every `null`, `[]` and flag default, and `plantCreate` is `plantFields.extend(defaulted(plantDefaults))`-style, so a new field costs one line there, not two in `extend`.
- **Types:** `PlantSummary` = id, combinationId, name, scientificName, family, description, native, `PlantFlags`, level fields, arrays, sun bars, seasons, lifespan, images, createdAt. `Plant` adds `combination`, `lifecycles`, `diseases`, `trivia`, `secret` and **loses `tips`**.
- **Lifecycles:** `seed: boolean` → `tab: z.enum(LIFECYCLE_TABS)` in create, update, save and the `Lifecycle` type; `seedStagesFirst` becomes `tabsInOrder` (seed → plant → care, same error style).
- **Diseases:** `content` → `symptoms`, `what`, `action` in `diseaseCreate/Update` (plain text, like now), in `plantSave` (`richTextNoImages.nullable()`, at least one non-empty) and in the `Disease` type.
- **Remove:** `tipCreate/Update/Save`, `TipSummary`, `Tip`, `plantTipRow`, `plantSave.tips`, the `uniqueBy` use for tips (keep `uniqueBy`, `combinationSave` uses it), `PLANT_TRAIT_SUGGESTIONS` stays (`native`).

### `search.ts`

`PlantFilterFields` = pick of the new filter fields: `family` is **not** in it; it carries flags, `potSizes`, `difficultyLevels`, `timeNeeded`, `toxicity`, the three tolerance fields, the two sun bars, `seedingSeason`, `plantingSeason`, `lifespanMin/Max`, `evergreen`. Net payload per plant is about the same (price, kind, size, wind are gone).

## 5 — Backend

### `plants.columns.ts`

- Replace `MONTH_COLUMNS` with `SEASON_COLUMNS: Record<SeasonField, readonly (readonly [col, col])[]>` (`satisfies` the schema's keys), `seasonOf(row, field)`, `seasonColumns(field, ranges)`, and make `toColumns` handle **every** season field present in the input (only when sent, so a PATCH without it keeps the ranges; same behavior as today).
- Add `difficultyColumn(levels)` (the derived integer, D9) and call it inside `toColumns` when `difficultyLevels` is sent. Clients never see or send `difficulty`.
- `toFilterFields(row)` returns the new filter fields (same function feeds the plant API and the search index, kept).
- The sun bars (row → `{ start, end } | null`) are mapped here too, so the row→API mapping stays in one place.

### `plants.repo.ts`

- `toSummary` adds `family` and everything from `toFilterFields`; `toJson` adds `trivia`, `secret`, drops `tips` and the `tipLinks` relation, the `plantTips` import and `toTip`.
- `list` stays summary-only with the same query (`beforeCursor`, `fetchLimit`, images only): no new joins, still about `limit + 1` primary-key reads.
- `create`/`update` pass through `toColumns` unchanged in shape.

### `plants.routes.ts`

No change: `crudRoutes({ access: 'public-admin', create: plantCreate, update: plantUpdate, filter: plantFilter, repo })`. The comment line drops «tips».

### `diseases.repo.ts`, `lifecycles.repo.ts`

`toDisease` / `toLifecycle` map the new columns; the routes' schemas come from shared. `lifecycles` list order is still `position, id`.

### `admin/plants/plants.save.ts`

- Remove `assertTipsExist`, `createNewTips`, `deleteOrphanTips`, `forgetTips`, `plantTipLinks`, the tip rows in `childStatements`/`linkFields`, and `tipLinks` from the existing-plant query. The create path loses the `created` tips bookkeeping and its `try/catch` rollback keeps only the plant delete.
- `lifecycleRows.toRow` writes `tab`; `diseaseRows.toRow` writes the three JSON-stringified texts.
- `linkFields` adds `symptoms`, `what`, `action` per disease, and `trivia`/`secret` is plain text so it is not link-checked.

### Search index (`search/search.routes.ts`)

Unchanged apart from the type: it already spreads `toFilterFields(p)`. The comment about price/size goes.

### Blog links (`blogs/blog-links.ts`)

`linkedFromCount`: remove the `tips` line and count the three new disease columns with the same `plain`/`rich` patterns. `trivia` and `secret` are plain texts without links (D13), so they are not counted.

### Tips removal

- Delete `backend/src/resources/tips/` and `backend/src/resources/admin/tips/`.
- `index.ts`: remove the `tipsRoutes` import and `.route('/api/tips', …)`.
- `admin/admin.app.tsx`: remove the `tipsAdmin` import/route. `admin/admin.repo.ts`: remove `tips` from the imports and the dashboard list entry (`key: 'tips'`).
- `admin/plants/plants.admin.tsx`: remove the tips list widget and its picker.

### Dashboard form (minimal, to keep the backend compiling and usable)

`plants.admin.tsx` gets plain stand-in inputs for the new fields (as plan 07 did): the existing `Choices`/`TextChoices`/`Check` helpers for tolerance and tabs, multi-checkboxes for the four JSON lists, two `MonthPair` lists for the seasons, plain number inputs for lifespan and sun hours, three editors for each disease. Pass `startField`/`endField` into `SunWindow` (`ui/sun-window.tsx`, `admin-editor/sun-window.ts`) instead of the hard-coded `sunStart`/`sunEnd` so it can serve both bars; the 6–21 bound is a prop. The real widgets (pot-size picker, two-bar sun graph) are the dashboard-widgets plan.

## 6 — Cache keys and invalidation

How it works today, and why nothing changes:

- **Key:** `edge-cache.ts` keys on the request **URL only** (`caches.default`, GET with `s-maxage`). The cacheable URLs are `/api/plants?limit&cursor[&combinationId]`, `/api/plants/:id`, `/api/lifecycles?plantId`, `/api/diseases?plantId`, `/api/search-index`. This plan adds **no** query parameter (D16) and makes no plant field per-user, so the number of cached variants and the hit ratio stay the same. Rule for the app plan: filter on the phone from the search index; a server-side filter parameter would multiply keys.
- **Policy:** `PUBLIC_READ_CACHE` (60 s browser, 1 h edge, 24 h stale-while-revalidate) stays; `crudRoutes` keeps adding it to public reads.
- **Invalidation:** every dashboard save and delete goes through `resource.tsx`, which calls `purgeApiCache(env)` (whole host). `plants.save.ts` is reached from there, so the new fields are covered with no code. The tips admin is deleted with its purge calls.
- **Removed endpoint:** `/api/tips*` just stops existing; cached copies expire or are purged.
- **Deploy:** after deploying (and after applying 0017 remotely) run one purge so no pre-deploy answer in the old shape is served: use the same Cloudflare call as `purgeApiCache` (a one-off from the dashboard, or any admin save).
- **Sizes:** the search index loses price/kind/size/wind and gains the arrays and sun bars; check its JSON size on the local data (Testing 5).
- **Known gap, not changed here:** writes through the public API (`POST/PATCH/DELETE /api/plants`) do not purge; only dashboard saves do (Open item).

## 7 — Testing

The repo has no test runner, so verification is typecheck plus runs against the local database. Nothing below touches remote.

1. **Migration on a copy:** copy the local D1 sqlite, add 3–4 plants with children (lifecycles with `seed=1`, diseases, plant_tips, images, a combination, posts with `plant_id`) and the old-lifespan cases (`2 years`, `4-6 weeks`, `6 months`, empty), then apply `0017` to the copy. Check: child rows survive, all conversions in D6, D7, D9, D14 are right, CHECKs still rejected out-of-range values, `PRAGMA foreign_key_check` is empty.
2. **Drift check:** with the hand-written snapshot, `npx drizzle-kit generate` (run on a scratch copy of `drizzle/`) must report "nothing to migrate".
3. **Typecheck:** `npm run typecheck` in `packages/shared` and `backend`. The app is expected to fail until its plan (Risk 5).
4. **API runs with `wrangler dev` and the local DB:** create, patch (a body without seasons keeps them; with `[]` clears), get, list a plant; a bad `toxicity` (`none` + `cat`), a sun bar of 5–9 or 12–12, 4 season ranges and a duplicate pot size must answer `400 VALIDATION_ERROR` with paths. Dashboard form: save a plant with a disease (3 texts), three tabs of stages in the wrong order (expect the error at the stage).
5. **Search index:** `GET /api/search-index` returns the new fields, compare the byte size against the current local one.
6. **Cache:** the Cache API does nothing on `workers.dev` or local dev, so test on the custom domain only after the app plan ships: read twice (second is a hit), save a plant in the dashboard, read again (new data), and confirm `GET /api/tips` is 404. Limit: this step is not possible before the deploy.
7. **Blog dashboard:** open a blog page in the dashboard to confirm `linkedFromCount` no longer fails.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Back up local D1 (and remote, with approval) | `backend/backup-before-0017.sql` |
| 2 | Shared lists and helpers: remove old, add flags, `PLANT_USAGE_FLAGS`, level/pot/toxicity/tab lists, seasons, sun bars, lifespan label | `packages/shared/src/plant-fields.ts` |
| 3 | Shared schemas and types: `plantFields`, builders, `plantDefaults`, lifecycles `tab`, diseases three texts, remove tips | `packages/shared/src/plants.ts` |
| 4 | Search index type | `packages/shared/src/search.ts` |
| 5 | `schema.ts`: new/removed columns, CHECK column names, drop tips tables and relations, `lifecycles.tab`, `diseases` texts | `backend/src/db/schema.ts` |
| 6 | Hand-written migration + journal entry + snapshot | `backend/drizzle/0017_plant_fields_v2.sql`, `backend/drizzle/meta/_journal.json`, `0017_snapshot.json` |
| 7 | Test the migration on a copy (Testing 1–2) | scratch copy, nothing committed |
| 8 | Row↔API mapping: seasons table, difficulty column, filter fields | `backend/src/resources/plants/plants.columns.ts` |
| 9 | Plants repo (summary/detail), routes comment | `backend/src/resources/plants/plants.repo.ts`, `plants.routes.ts` |
| 10 | Diseases and lifecycles repos | `backend/src/resources/diseases/diseases.repo.ts`, `lifecycles/lifecycles.repo.ts` |
| 11 | Dashboard save: remove tips, write `tab` and disease texts, link fields | `backend/src/resources/admin/plants/plants.save.ts` |
| 12 | Remove tips resource, admin tips, mounts and list entry | `backend/src/resources/tips/`, `admin/tips/`, `index.ts`, `admin/admin.app.tsx`, `admin/admin.repo.ts` |
| 13 | Blog link counter without `tips`, with the new disease columns | `backend/src/resources/blogs/blog-links.ts` |
| 14 | Dashboard stand-in inputs; `SunWindow` field props | `backend/src/resources/admin/plants/plants.admin.tsx`, `admin/ui/sun-window.tsx`, `backend/admin-editor/sun-window.ts`, `admin/ui/fields.tsx` |
| 15 | Search index comment/type check | `backend/src/resources/search/search.routes.ts` |
| 16 | Typecheck, API runs, cache notes (Testing 3–7) | — |
| 17 | Update the "adding a resource" example if it mentions tips; note the plants contract in the docs | `instructions/adding-a-resource.md` (only if it names tips) |

Files **not** touched: `app/` (separate plan), `backend/src/lib/crud.ts`, `lib/pagination.ts`, `lib/relations.ts`, `lib/purge.ts`, `middleware/edge-cache.ts` and the rest of `middleware/`, `auth.ts`, `wrangler.jsonc`, `drizzle.config.ts`, other resources (posts, blogs except the link counter, likes, images, me), and the remote database (no remote migration or deploy in this plan).

## Open items

1. **Lifecycle «additional tab»** (D14): the idea file says "an additional tab" and the page mockup names it «περιποίηση». I read it as a third stage tab (`care`). Confirm, or tell me if it is a separate text instead.
2. **Fruiting and flowering dates** (καρποφορία, ανθοφορία): the page mockup shows four date rows, but the field list has only seeding and planting. They are not in this plan; D15 makes adding them cheap.
3. **Genus** (D12) and the `greenness` name for «Πρασινάδα» (D10): defaults, tell me if you want other names.
4. **Public API writes do not purge the cache** (Section 6). Adding a `purgeApiCache` to the write routes of `crudRoutes` for `public-*` access would fix it, but `lib/crud.ts` is shared core code, so I left it out. Want it added?
5. **Remote rollout:** applying 0017 remotely and deploying needs your explicit go-ahead, together with the app release.

## Note from plan 15

Usage flags, the seeding season and the sun bars are dimmed but still saved when a plant is not outdoor, so a plant marked indoor-only can still carry them. The app must ignore them for indoor-only plants.
