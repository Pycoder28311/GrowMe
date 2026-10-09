# 07 — Plant fields: data foundation

**Goal:**
- **Database and API:** plants get the new fields from `docs/ideas/fieldPlantChanges.md`:
  - 9 yes/no flags
  - wind, kind and size
  - difficulty with 3 levels
  - up to 3 month ranges
  - a sun window as clock hours
  - a lifespan
  - lifecycle stages with a seed flag and a duration
- **Shared helpers:** every value list, label and helper lives once in `packages/shared`, ready for plans 08 and 09 to import.
- **Nothing breaks in between:** the dashboard form gets plain inputs for the new fields, and the app compiles and shows the flags simply.

**Depends on:** remote migration 0012 (`user_locations`), still pending.
**Blocks:**
- **08:** the dashboard's widgets (month-range dragging, the sun bar, the duration box, seed and plant stage buttons)
- **09:** the app plant page and filters (the sun graph, the lifecycle timeline, on-phone filters)

### Where this sits

| Plan | Covers | Status |
|---|---|---|
| **07** (this) | Shared types and helpers, migration, API, search index fields, plain stand-in inputs | — |
| 08 | Dashboard plant form widgets | written after 07 is built |
| 09 | App plant page and filters | written after 07 is built |

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Wind has 4 levels: `strong` «Αντέχει δυνατό αέρα» · `moderate` «Αντέχει μέτριο αέρα» · `light` «Λίγο αέρα» · `sheltered` «Θέλει προστατευμένο σημείο». The short filter's «Αντέχει αέρα» checkbox matches `strong` and `moderate` (`WIND_TOLERANT`) | User |
| D2 | New **size** field: `small` Μικρό · `medium` Μεσαίο · `large` Μεγάλο | User |
| D3 | `seeds` is **dropped**: seed and plant stages replace it. Difficulty becomes 3 levels (1 Εύκολο, 2 Μέτριο, 3 Δύσκολο). Existing values map 1–2 → 1, 3 → 2, 4–5 → 3 | User |
| D4 | Filters run **on the phone** (plan 09). This plan only adds the filter fields to `/api/search-index` | User |
| D5 | Plan 07 adds **simple working inputs** for every new field in the dashboard, plus the smallest app changes needed to compile and show them. Plans 08 and 09 replace these with the real widgets | User |
| D6 | Existing sun hours become a window **centred on 13:00**, using the **smaller** count (what the app treats as the need today). 6–8 h → 10:00–16:00, 3 h → 12:00–15:00, 0 h → empty | User (the example given; "larger" in the question was a slip) |
| D7 | Month ranges: `month_start`/`month_end` stay as range 1, plus new `month_start_2`, `month_end_2`, `month_start_3`, `month_end_3`. The API returns `monthRanges: [start, end][]` (0–3 items, in order) | User |
| D8 | Αρωματικό shows «Αρωματικό» only when yes | User |
| D9 | **Flags** are stored as flat columns and sent as flat API fields: `aromatic`, `climbing`, `ornamental`, `food`, `succulent`, `smallTree`, `privacy`, `nearSea`, `frostHardy`. All `NOT NULL DEFAULT false`. Flat keeps the dashboard's `data-field` collection (no nested objects) and filter matching (`plant[key]`) simple | Default |
| D10 | What each flag shows (`PLANT_FLAGS`; null means nothing is shown): <br>• food: yes «Φαγώσιμο» / no null <br>• climbing: yes «Αναρριχητικό» / no null <br>• succulent: yes «Παχιά φύλλα» / no «Λεπτά φύλλα» <br>• smallTree: never shown (filters only) <br>• nearSea: yes «Κοντά στη θάλασσα» / no null <br>• frostHardy: yes «Ανθεκτικό στον παγετό» / no «Ευαίσθητο στον παγετό» <br>• privacy: yes «Ιδιωτικότητα» / no null <br>• ornamental: yes «Καλλωπιστικό» / no null <br>• aromatic: yes «Αρωματικό» / no null <br>The final field list wins over the first paragraph of the ideas file, which said «Μη φαγώσιμο» | User (ideas file) |
| D11 | **Kind:** `flowers` Ανθοφόρο · `leaves` Φυλλώδες · `bush` Θάμνος. Kind, wind and size are each nullable, meaning not set yet | Default |
| D12 | **Sun columns renamed:** `sunlight_hours_min`/`max` become `sun_start`/`sun_end` (API `sunStart`/`sunEnd`). They are whole hours 0–24 with start < end, both set or both empty. A window doesn't cross midnight (00:00–24:00 is one day). The new name stops anyone reading them as hour counts | Default |
| D13 | **Durations** are strings, `<n> <unit>` or `<n>-<m> <unit>`, unit `days`/`weeks`/`months`/`years`, n < m, numbers 1–9999 (e.g. `4-6 weeks`). The Greek label is made in the client (`durationLabel`) | Default (the user asked for strings like "4-6 weeks") |
| D14 | `plants.lifespan` (nullable duration) is how long the plant lives. `lifecycles.duration` (nullable duration) counts **from sowing**. `lifecycles.seed` (bool, default false) marks stages before the plant is sold as a transplant. The save rule: all seed stages come before all plant stages. Existing stages become plant stages with no duration | Default (ideas file) |
| D15 | Shared value lists and helpers go in a new `packages/shared/src/plant-fields.ts`, exported from `index.ts`. `plants.ts` keeps the zod schemas and imports from it | Default |
| D16 | `food` conversion: any text except «Μη φαγώσιμο» and «Τοξικό» → true. Empty → false. Blog links in the old text are lost: it was ≤60 characters, and the `native` and stage texts still take links | Default |
| D17 | `difficulty` stays an integer column. The old CHECK (1–5) stays, since changing it needs a table rebuild; zod now allows only 1–3 | Default |
| D18 | `PLANT_TRAIT_SUGGESTIONS` keeps only `native` | Default |

## 1 — Risks and blockers

1. **Hand-written migration.** drizzle-kit would rebuild `plants`, and on D1 (foreign keys always on) that deletes lifecycles, tip links, diseases and photo links (see 0010's header).
   - Every change uses `ADD`, `UPDATE`, `DROP COLUMN` or `RENAME COLUMN`.
   - `DROP COLUMN` works only on columns no index, foreign key or CHECK uses:
     - `seeds`: fine
     - `food`: fine
     - `sunlight_hours_*`: are renamed, not dropped
   - The new month columns get **no** database CHECK, because a table CHECK would need a rebuild. zod validates them.
2. **The API shape changes and the app build people have now breaks.** Fields affected: `seeds` and `sunlightHours*` are removed; `food` becomes a boolean; `monthStart`/`monthEnd` become `monthRanges`. **Don't deploy the backend or apply 0013 remotely until plan 09 ships with a new app build.** Local only until then.
3. **Defaults after the migration:**
   - `frostHardy` and `succulent` default to false, so every existing plant shows «Ευαίσθητο στον παγετό» and «Λεπτά φύλλα» until an admin fills them in.
   - Fill in the existing plants locally before release (task 12). Do the same on remote right after the remote migration.
4. **The sun conversion is a guess** (D6). Each plant needs a quick check in the dashboard.
5. Remote 0012 must be applied before 0013, with the user's approval.

## 2 — Architecture

```
packages/shared/src/plant-fields.ts   value lists + labels + pure helpers (no zod)
        │  imported by
        ├── packages/shared/src/plants.ts       zod: plantFields / plantSave / lifecycle* + types
        ├── packages/shared/src/search.ts       SearchPlant gains the filter fields
        ├── backend  (repo, save, search index, dashboard stand-in inputs)
        └── app      (plant-traits.ts, plant card / facts: simple display)
```

The database stores flat columns. `plants.repo.ts` turns the month columns into `monthRanges` on read, and `plants.save.ts` (plus the public CRUD create and update) turns `monthRanges` back into columns on write. One pair of helpers does this in both directions: `monthColumns(ranges)` and `monthRangesOf(row)`.

## 3 — Shared: `plant-fields.ts` (new)

The tables of values, all `as const`, with Greek labels:

```ts
export const DIFFICULTIES = [{ value: 1, label: 'Εύκολο' }, { value: 2, label: 'Μέτριο' }, { value: 3, label: 'Δύσκολο' }] as const
export const WIND_LEVELS = [
  { value: 'strong', label: 'Αντέχει δυνατό αέρα' },
  { value: 'moderate', label: 'Αντέχει μέτριο αέρα' },
  { value: 'light', label: 'Λίγο αέρα' },
  { value: 'sheltered', label: 'Θέλει προστατευμένο σημείο' },
] as const
export const WIND_TOLERANT: WindLevel[] = ['strong', 'moderate']
export const PLANT_KINDS = [{ value: 'flowers', label: 'Ανθοφόρο' }, { value: 'leaves', label: 'Φυλλώδες' }, { value: 'bush', label: 'Θάμνος' }] as const
export const PLANT_SIZES = [{ value: 'small', label: 'Μικρό' }, { value: 'medium', label: 'Μεσαίο' }, { value: 'large', label: 'Μεγάλο' }] as const
export const DURATION_UNITS = [
  { value: 'days', one: 'μέρα', many: 'μέρες' },
  { value: 'weeks', one: 'εβδομάδα', many: 'εβδομάδες' },
  { value: 'months', one: 'μήνας', many: 'μήνες' },
  { value: 'years', one: 'χρόνος', many: 'χρόνια' },
] as const

/** Every yes/no field: the dashboard label, what the user sees for yes / no (null = nothing) */
export const PLANT_FLAGS = [
  { key: 'food', label: 'Βρώσιμο', emoji: '🍅', yes: 'Φαγώσιμο', no: null },
  { key: 'aromatic', label: 'Αρωματικό', emoji: '🌿', yes: 'Αρωματικό', no: null },
  /* … climbing, ornamental, succulent, smallTree, privacy, nearSea, frostHardy (D10) */
] as const
export type PlantFlag = (typeof PLANT_FLAGS)[number]['key']
```

The pure helpers, each a few lines and unit-tested:

| Helper | Does | Used by |
|---|---|---|
| `flagPhrase(flag, value)` | the yes/no phrase, or null | app chips (07 simple, 09 real), dashboard hints |
| `visibleFlags(plant)` | `{ key, emoji, label }[]` of the flags with a phrase | app |
| `parseDuration(s)` | `{ from, to \| null, unit } \| null` | zod refine, dashboard box (08), app |
| `formatDuration(d)` | back to `4-6 weeks` | dashboard box (08) |
| `durationLabel(s)` | «4–6 εβδομάδες», «1 χρόνος» | app (07 simple text, 09) |
| `sunLength(start, end)` | hours of sun | app, filters |
| `sunPart(start, end)` | `'morning' \| 'noon' \| 'afternoon'` from the middle of the window (< 11 morning, ≤ 15 noon, else afternoon) | app graph and filter (09) |
| `SUN_PARTS` | Greek labels: πρωινός / μεσημεριανός / απογευματινός ήλιος | app |
| `monthsOfRange([s, e])` | months in a range, wrapping past December (moved from the app's `monthsInRange`) | app, season filter |
| `rangesCoverMonth(ranges, m)` | any range contains month `m` | season filter (09) |

Types exported: `WindLevel`, `PlantKind`, `PlantSize`, `DurationUnit`, `PlantFlag`, `MonthRange = [number, number]`.

## 4 — Shared: `plants.ts` and `search.ts`

- **`plantFields`:**
  - remove `seeds`, `sunlightHoursMin`/`Max`, `monthStart`/`monthEnd`
  - `food` becomes a boolean; add the other 8 flags as booleans
  - `wind`, `kind`, `size`: `z.enum(...).nullable()`
  - `difficulty`: 1–3
  - `sunStart`, `sunEnd`: int 0–24, nullable
  - `monthRanges`: `z.array(z.tuple([month, month])).max(3)`
  - `lifespan`: `duration.nullable()`, where `duration = z.string().trim().max(20).refine(s => parseDuration(s) !== null, 'Use e.g. "4-6 weeks"')`
- **Refines:** replace `rangesInOrder` and `monthsTogether` with:
  - price in order
  - sun both-or-neither, with `sunStart < sunEnd`
- **`plantCreate` defaults:**
  - flags → `false`
  - wind, kind, size, sun, lifespan → `null`
  - `monthRanges` → `[]`
- **Lifecycles:**
  - `lifecycleCreate` and `lifecycleUpdate` get `seed` (default false) and `duration` (nullable)
  - `Lifecycle` type gets `seed: boolean` and `duration: string | null`
  - `plantSave.lifecycles` rows: `{ id?, title, content, seed, duration }`
  - refine: no seed stage after a plant stage, error at `lifecycles.<i>.seed`
- **`PlantSummary`:** mirrors the new fields (flags, `wind`, `kind`, `size`, `difficulty`, `sunStart`, `sunEnd`, `monthRanges`, `lifespan`). `seeds` is gone.
- **`search.ts`:** `SearchPlant` gets `PlantFilterFields`, a `Pick<PlantSummary, …>` of:
  - `priceMin`, `priceMax`
  - `sunStart`, `sunEnd`
  - `monthRanges`
  - `wind`, `kind`, `size`
  - `difficulty`
  - the 9 flags

  Defined once, so plan 09's filters type against it.

## 5 — Database: schema and migration 0013

**`backend/src/db/schema.ts`, `plants`:**
- drop `seeds`
- `food`: `integer('food', { mode: 'boolean' }).notNull().default(false)`
- the 8 other flags, the same way (`small_tree`, `near_sea`, `frost_hardy` in snake case)
- `wind`, `kind`, `size`: `text(…, { enum })`, nullable; enums from `plant-fields.ts`
- `sunStart: integer('sun_start')`, `sunEnd: integer('sun_end')`
- `monthStart2`, `monthEnd2`, `monthStart3`, `monthEnd3`
- `lifespan: text('lifespan')`
- update the `difficulty` comment to say 1–3, with the CHECK left as it is (D17)

**`lifecycles`:**
- `seed: integer('seed', { mode: 'boolean' }).notNull().default(false)`
- `duration: text('duration')`

**`backend/drizzle/0013_*.sql`.** Run `npx drizzle-kit generate` for the snapshot, then **replace** the generated SQL with:

```sql
-- Edited by hand (no rebuild of `plants`; see 0010)
ALTER TABLE `plants` ADD `food_b` integer DEFAULT false NOT NULL;
UPDATE `plants` SET `food_b` = CASE WHEN `food` IS NOT NULL AND trim(`food`) <> ''
  AND `food` NOT IN ('Μη φαγώσιμο','Τοξικό') THEN 1 ELSE 0 END;
ALTER TABLE `plants` DROP COLUMN `food`;
ALTER TABLE `plants` RENAME COLUMN `food_b` TO `food`;
ALTER TABLE `plants` DROP COLUMN `seeds`;
ALTER TABLE `plants` ADD `aromatic` integer DEFAULT false NOT NULL;   -- … one line per flag
ALTER TABLE `plants` ADD `wind` text;  ADD `kind` text;  ADD `size` text;
ALTER TABLE `plants` ADD `month_start_2` integer; …_end_2, _start_3, _end_3
ALTER TABLE `plants` ADD `lifespan` text;
UPDATE `plants` SET `difficulty` = CASE WHEN `difficulty` <= 2 THEN 1 WHEN `difficulty` = 3 THEN 2 ELSE 3 END;
-- sun: centre the smaller count on 13:00 (D6), then rename (steps below)
```

- **Sun step.** Write it as two steps over a temporary column `sun_h = coalesce(sunlight_hours_min, sunlight_hours_max)`, then:
  - `start = max(0, min(13 - sun_h/2, 24 - sun_h))`
  - `end = start + sun_h`
  - drop `sun_h`
  - rename `sunlight_hours_min` → `sun_start` and `sunlight_hours_max` → `sun_end`
  - check the snapshot names the columns the same way
- **Lifecycles:**
  ```sql
  ALTER TABLE `lifecycles` ADD `seed` integer DEFAULT false NOT NULL;
  ALTER TABLE `lifecycles` ADD `duration` text;
  ```
- Keep the `--> statement-breakpoint` separators, as in 0010.

**Testing the migration:**
- Run it on a copy of the local D1 file (Python sqlite) and on a fresh `wrangler d1 execute --local`.
- Compare the counts of `plants`, `lifecycles`, `plant_tips`, `plant_images` and `diseases` before and after.
- Spot-check the converted `food`, `difficulty` and `sun_*` values.
- Then apply locally with `npx wrangler d1 migrations apply DB --local`.

## 6 — Backend API

- **`plants.repo.ts`:**
  - `toSummary` maps the new columns
  - `monthRangesOf(p)` builds `monthRanges` from the 3 column pairs, skipping empty ones
  - `create` and `update` (public CRUD) write through `monthColumns(fields.monthRanges)`, which fills pairs 1–3 and nulls the rest, but only when `monthRanges` is sent (an update may omit it)
  - put both helpers in a small `plants.columns.ts` next to the repo, so `plants.save.ts` reuses them
- **`lifecycles.repo.ts`:** `toLifecycle` adds `seed` and `duration`. Create and update pass them through.
- **`plants.save.ts`:**
  - `lifecycleRows.toRow` writes `seed` and `duration`; `position` stays the index, which the zod refine guarantees puts seed stages first
  - `fields` goes through `monthColumns`
  - `linkFields` drops `food` and `seeds`; it keeps `description`, `native`, lifecycles, tips and diseases
- **`search.routes.ts`:**
  - select the filter columns too
  - map them with the same `toFilterFields(p)` helper the repo exports, so the two mappings can't drift
  - the doc comment notes the index now also drives plan 09's filters
- **`blogs/blog-links.ts`:** check that nothing else reads `plants.food` or `plants.seeds` as text (grep `food`, `seeds`).

## 7 — Dashboard stand-in inputs (`plants.admin.tsx`)

Plain inputs built from the existing `ui/fields.tsx` parts. Plan 08 replaces the marked ones.

| Field | Stand-in | Plan 08 replaces with |
|---|---|---|
| Difficulty | `Choices` over `DIFFICULTIES` | — (stays) |
| 9 flags | one `Toggle` per `PLANT_FLAGS` row (label + emoji), in a «Χαρακτηριστικά» card under the scientific name | — (stays) |
| Wind | `TextChoices` over `WIND_LEVELS` with «Δεν ορίστηκε» (null), under the flags | — (stays) |
| Kind, size | `TextChoices` | — (stays) |
| Sun | existing `RangeField`, relabelled «Ήλιος: από – έως (ώρα)», fields `sunStart`/`sunEnd` | the sun bar |
| Month ranges | 3 `MonthRange` rows, «Εποχή 1/2/3», 2 and 3 optional, collected into `monthRanges` | add/remove/drag list |
| Lifespan | `TextField` with the hint «π.χ. 4-6 weeks» | the duration box |
| Stage seed / duration | `Toggle` «Στάδιο σπόρου» + `TextField` «από τη σπορά, π.χ. 2-3 weeks» in each stage row | 2 add buttons, coloured seed stages, duration box |

- **Collecting `monthRanges`.** `MonthRange` writes `monthStart`/`monthEnd` fields. Give the 3 pairs data-fields like `monthRanges.0.0`, or add a small `data-type="month-ranges"` collector in `admin.client.js` that turns the 3 rows into the array and skips empty pairs.
  - Pick whichever fits `admin.client.js`'s `readValue`/path code (line ~109 already splits paths) with the least new code.
  - Plan 08's drag list writes the same shape.
- **Remove:** `TraitFact` for `food` and `seeds`, and the local `DIFFICULTY` table (the list item uses `DIFFICULTIES`).
- **Keep:** the `native` `SuggestField`.

## 8 — App: minimum changes (`app/src`)

- **`config/plant-traits.ts`:**
  - the `PlantFields` type follows `PlantSummary`
  - `sunlightTrait` and the hours label use `sunLength(sunStart, sunEnd)`
  - `effortTrait` uses 1/2/3
  - `seasonTrait` uses `monthRanges[0]` and joins the labels when there are several
  - `monthsInRange` imports `monthsOfRange` from shared
  - `useTrait` reads the `food` boolean (🍅 Φαγώσιμο)
  - delete `propagationTrait`
- **`components/plants/plant-card.tsx`:** drop propagation and keep the rest. **`plant-facts.tsx`:** add a plain wrap of chips from `visibleFlags(plant)` and a «Ζει …» line from `durationLabel(lifespan)`.
- **`life-cycle-card.tsx`:** show `durationLabel(duration)` next to the title when set. Nothing else; plan 09 rebuilds it.
- Run typecheck and lint.

## Testing

| What | How |
|---|---|
| Shared helpers | Scratch unit script (as for `matchSearch`), covering: <br>• every `PLANT_FLAGS` phrase <br>• `parseDuration` good and bad (`4-6 weeks`, `2 years`, `6-4 weeks` ✗, `4 weeks-6` ✗, `0 days` ✗) <br>• `durationLabel` singular and plural <br>• `sunPart` edges (10–12 morning, 11–15 noon, 14–20 afternoon) <br>• `monthsOfRange` wrapping <br>• `rangesCoverMonth` |
| zod | Rejects: <br>• a 4th month range <br>• `sunStart >= sunEnd` <br>• only one of sun start/end <br>• a seed stage after a plant stage <br>• a bad duration <br>• difficulty 4 <br>• wind `foo` |
| Migration | §5 checks (row counts and spot values) on a copy, then locally |
| API (local wrangler) | <br>• Create and update through `/api/admin/plants`: every new field round-trips <br>• a public `PATCH` without `monthRanges` keeps the ranges <br>• `GET /api/plants/:id` shape <br>• `/api/search-index` has the filter fields <br>• lifecycle CRUD with `seed` and `duration` |
| Dashboard (fake-access browser run) | <br>• Open an existing plant, change every new input, save, reload: the values persist <br>• a seed stage below a plant stage → field error |
| App (Expo web) | The plant page and card render for an old (migrated) plant and a newly filled one; no runtime errors |
| Checks | `typecheck` in `packages/shared`, `backend` and `app`; app lint |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `plant-fields.ts`: tables, `PLANT_FLAGS`, helpers; export from index | `packages/shared/src/plant-fields.ts`, `index.ts` |
| 2 | Unit-check the helpers | scratchpad |
| 3 | zod schemas and types: plant fields, refines, lifecycles, `PlantSummary`, `SearchPlant` | `packages/shared/src/plants.ts`, `search.ts` |
| 4 | Drizzle schema | `backend/src/db/schema.ts` |
| 5 | Generate, then hand-write `0013`; test on a copy; apply locally | `backend/drizzle/0013_*.sql`, `meta/` |
| 6 | `monthColumns`, `monthRangesOf`, `toFilterFields`; repo mapping; public CRUD writes | `plants/plants.columns.ts`, `plants.repo.ts` |
| 7 | Lifecycles `seed`/`duration` | `lifecycles/lifecycles.repo.ts` |
| 8 | Save: month columns, stage fields, `linkFields` | `admin/plants/plants.save.ts` |
| 9 | Search index filter fields | `search/search.routes.ts` |
| 10 | Dashboard stand-in inputs (+ month-ranges collector if needed) | `admin/plants/plants.admin.tsx`, `admin/admin.client.js` |
| 11 | App: minimum changes, then typecheck and lint | `app/src/config/plant-traits.ts`, `components/plants/*` |
| 12 | API, dashboard and app tests; fill flags, wind, kind, size and the sun check for local plants | scratchpad |
| 13 | Docs: `adding-a-resource.md` note on flag tables in shared (`PLANT_FLAGS` pattern) and hand-written migrations | `instructions/adding-a-resource.md` |
| 14 | **With approval, and only together with plan 09's app build:** remote 0012 + 0013 (after `wrangler d1 export … --remote` backup), deploy, commit | — |

**Files not touched:**
- `Experiments/plant demo`
- `Personal/Portfolio`
- the TakeTheTrip codebase
- the app's filters (`config/results-filters.ts`, `components/filters/*`) and search UI: those are plan 09
- the dashboard's visual widgets: those are plan 08

## Open items

- Wind and kind labels (D1, D11) are proposals: change the Greek wording if you prefer.
- Should a plant be able to have no kind? The default is nullable.
