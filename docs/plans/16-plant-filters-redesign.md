# 16 — Plant filters redesign (indoor and outdoor sets)

**Goal:** the results page's two sections (indoor plants, outdoor plants) filter **real plants** with their own filter sets: two sunlight range bars (6:00–21:00, two hour inputs each), pot sizes, difficulty, time needed, toxicity, usage (outdoor), seeding and planting seasons that clear each other, and «green all year». The filters are one data-driven config plus one generic matcher; adding a filter is one config entry. Filtering runs on the phone over the cached search index, so the backend and the cache keys do not change.

**Depends on:** plan 14 (the new fields in `PlantSummary`/`SearchPlant`, the `/api/search-index` payload); the app files listed in Risk 4 compile again (or are fixed by the app plant-page plan). **Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Two filter sets, one config.** Each filter in `config/section-filters.ts` lists the sections it appears in (`indoor`, `outdoor`). Indoor: sun bars, pot, difficulty, time, toxicity, planting season, green. Outdoor: all of those plus usage and seeding season. This is the set the mockup already has, and the idea file asks for | User (ideas file) |
| D2 | **Filtering stays on the phone.** The search index already carries every filter field (`PlantFilterFields`). No new backend route, no query parameters on `/api/plants` or `/api/search-index` (plan 14 D16). One cache key stays: `GET /api/search-index` | Default |
| D3 | **One config replaces two.** The old `config/plant-filters.ts` (kind, price, size, wind… all removed fields) and its users are deleted; `config/section-filters.ts` becomes the only filter config and `lib/plant-filter-match.ts` its only matcher | Default |
| D4 | **Filter kinds:** `chips` (a list of options, `many` or `one`) and `range` (two numbers on a bar, with inputs). Options and labels come from `@growme/shared` lists (`POT_SIZES`, `DIFFICULTY_LABELS`, `TIME_NEEDED_LABELS`, `TOXICITY`, `PLANT_USAGE_FLAGS`…), not retyped in the app | Default |
| D5 | **Sun matching:** the user's bar is the hours their spot has that kind of light. A plant matches when its bar (intense/soft) lies **inside** the chosen range. A bar at full width (6–21) is not active. A plant with no bar for that kind does not match an active bar (same rule as the old filters: no value, no match) | Default |
| D6 | **Chips match inside a filter by any option, across filters by all** (kept from `matchPlantFilters`). Multi-value fields (`potSizes`, `difficultyLevels`, `timeNeeded`, `toxicity`) match when the plant has **any** chosen value | Default |
| D7 | **Toxicity reads literally as «toxic to»:** Γάτα = the plant is toxic to cats, Σκύλος = toxic to dogs, «Για κανένα» = `none` (safe). «Για κανένα» and an animal exclude each other (existing rule) | Default (see Open item 1) |
| D8 | **Seasons:** seeding reads `seedingSeason`, planting reads `plantingSeason`; a plant matches a season when any of its ranges covers a month of it (`rangesCoverMonth`). Choosing in one clears the other, declared in the config as `clears: ['planting']` / `clears: ['seeding']`, not hard-coded | User (ideas file) |
| D9 | **Green:** one choice, «Όλο τον χρόνο» = `evergreen`, «Μέρος του χρόνου» = not `evergreen`. (The usage option «Πρασινάδα» is the separate `greenness` flag.) | Default |
| D10 | **Related results:** below the matches, under a label «Παρόμοια αποτελέσματα», the plants that pass some but not all active filters, most matched first (the existing `related` result of `matchPlantFilters`). The ideas file asks for this | User (ideas file) |
| D11 | **Place:** a plant is in a section when `plant.indoor` / `plant.outdoor` is true; a plant can be in both. This replaces the mock lists | Default |
| D12 | **Full-range sun bar and empty chips are "no filter":** the badge counts only changed filters (existing `chosenCount` rule) | Default |

## 1 — Risks and blockers

1. **Dead code to remove, not to reuse:** `config/plant-filters.ts`, `components/explore/explore-sheet.tsx`, `components/filters/{filter-sheet,filter-section,price-filter,filters-button}.tsx` and `lib/explore-filters.tsx` only serve the old set and read removed fields (`priceMin`, `kind`, `size`, `wind`, `sunStart`…). Before deleting, grep for any use outside them (the current grep finds none besides each other). If `FiltersButton` is used elsewhere, keep it.
2. **A name clash on purpose:** «Πρασινάδα» as a usage option is the `greenness` flag; «green all year» is `evergreen`. Config ids follow the field names so the two cannot be mixed up.
3. **Search index size grows with the catalogue.** Every plant carries ~25 filter fields (~400 bytes). A few thousand plants is a few hundred KB uncompressed, fine over gzip and the 1-hour edge cache. Past roughly 5,000 plants, server-side filtering needs its own plan (Section 6).
4. **The app does not compile against the new API yet** (plan 14 Risk 5). This plan fixes only what it touches: `config/section-filters.ts`, `lib/plant-filter-match.ts`, `components/results/*`, `app/(app)/results.tsx`, and the `PlantCardData` type in `components/plants/plant-card.tsx` (price and `monthRanges` are gone). Other fallout files stay for the app plant-page plan; check the touched files with `tsc` and ignore errors in the rest.
5. **Plants with missing data drop out of active filters** (D5, D6). Right after migration most plants have empty sun-soft bars, seasons and arrays; filtering will look sparse until the admin fills them in.

## 2 — Approach

```
@growme/shared                  lists, labels, SEASONS (new), SUN_MIN_HOUR / SUN_MAX_HOUR
        │
config/section-filters.ts       FILTERS: data only  { key, kind, label, sections, options|range, clears? }
        │  read by
lib/plant-filter-match.ts       pure: matchPlantFilters(plants, selection, section), toggleOption, chosenCount
        │
results.tsx ── useSearchIndex() ── GET /api/search-index (one URL, cached)
        │          plants of a section → match → cards, then «Παρόμοια αποτελέσματα»
SectionFilterSheet              renders filtersFor(section) from the config, by kind
```

Config and matcher import no React Native code, so they can be run by a plain Node script for checks.

## 3 — The filter config (`app/src/config/section-filters.ts`)

```ts
type Range = readonly [number, number]
type Test<T> = (plant: FilterPlant, value: T) => boolean

type ChipFilter = {
  kind: 'chips'; key: string; label: string
  sections: readonly SectionId[]
  select: 'many' | 'one'
  options: { id: string; label: string; test: (plant: FilterPlant) => boolean }[]
  clears?: readonly string[]          // choosing here empties these filters (D8)
  exclusive?: string                  // an option that excludes the others (toxicity «none»)
}
type RangeFilter = {
  kind: 'range'; key: string; label: string; sections: readonly SectionId[]
  min: number; max: number; ticks: number[]
  test: (plant: FilterPlant, range: Range) => boolean
}
export const FILTERS: readonly (ChipFilter | RangeFilter)[]   // sheet order
export const filtersFor = (section: SectionId) => FILTERS.filter(f => f.sections.includes(section))
export type Selection = Record<string, readonly string[] | Range>   // by filter key
```

- **Helpers keep entries short:** `optionsFrom(values, labels, test)` for shared value lists (`POT_SIZES`, `EFFORT_LEVELS`…), `seasonOptions(field)` for the two seasons (from the shared `SEASONS`), `flagOptions(keys)` for usage from `PLANT_USAGE_FLAGS` and `PLANT_FLAGS` labels.
- **Entries (order as in the sheet):** `sunIntense` and `sunSoft` (range 6–21, ticks 6…21 every 3, test D5), `pot` (`potSizes`), `difficulty` (`difficultyLevels`), `time` (`timeNeeded`), `toxicity` (D7, `exclusive: 'none'`), `usage` (outdoor), `seeding` (outdoor, `clears: ['planting']`), `planting` (`clears: ['seeding']`), `green` (`select: 'one'`).
- **Ids are the shared values** (`small`, `medium`, `big`, `large`, `cat`, `dog`, `none`, flag keys, season ids), so there is no label-to-value mapping to maintain. The old `edible`, `tree`, `lawn` ids become `food`, `smallTree`, `greenness`.
- **`NO_FILTERS` is generated** from the config (`Object.fromEntries`), not written by hand, so a new filter needs no second edit.
- **Shared additions (`packages/shared/src/plant-fields.ts`, additive):** `SEASONS = [{ id, label, months }]` (winter 12-1-2, spring 3-4-5, summer 6-7-8, autumn 9-10-11). No API change.

## 4 — The matcher (`app/src/lib/plant-filter-match.ts`)

Rewritten around `Selection` and the config; the exported names `matchPlantFilters`, `activeFilters`, `chosenCount`, `toggleOption` stay.

| Function | Does |
|---|---|
| `isActive(filter, selection)` | chips: something chosen; range: not the full `[min, max]` |
| `matchesFilter(plant, filter, value)` | chips: any chosen option's `test`; range: `filter.test(plant, range)` |
| `matchPlantFilters(plants, selection, section)` | `{ matches, related, activeCount }`: active filters are only those of the section (D1); same ordering rules as today |
| `toggleOption(selection, filter, optionId)` | `one`: replace; `exclusive`: drop the others / drop the exclusive; then empty every key in `clears` (D8) |
| `setRange(selection, filter, range)` | stores a range |
| `chosenCount(selection, section)` | active filters of the section |

Sun test (D5): `bar = sunBar(plant, 'intense' \| 'soft')` from shared; `bar !== null && bar.start >= from && bar.end <= to`.

## 5 — Screens

- **`components/results/section-filter-sheet.tsx`:** loops over `filtersFor(section)`. `kind: 'chips'` renders the existing `Chip` list; `kind: 'range'` renders `SunRangeFilter`. The hard-coded sun section and the `chipFiltersFor` call go. The sheet title and the «Φως (από τις 6 …)» section label come from the config (a `group` string on the two sun filters, so they stay under one heading).
- **`components/results/sun-range.tsx`:** takes `min`, `max`, `ticks` as props (from the config, ultimately `SUN_MIN_HOUR`/`SUN_MAX_HOUR` in shared) instead of importing `SUN_MIN`/`SUN_MAX`; behavior unchanged (two hour inputs clamped to the bar, `RangeSlider` underneath).
- **`app/(app)/results.tsx`:** `useSearchIndex()` (already caches 5 minutes in memory; the server answer is cached at the edge) replaces `MOCK_*` lists. Per section: `plants.filter(p => p.indoor|outdoor)` → name search (existing `plain` match) → `matchPlantFilters`. Shows a loading skeleton and a retry message when `error`, and the empty text. Related results render under a small label, using the same `PlantCard`.
- **`components/plants/plant-card.tsx`:** `PlantCardData` is reduced to what a `SearchPlant` has and the card shows (name, scientific name, native, cover, difficulty text from `difficultyLevels`, sun bar text, food flag); price and months pill lines are removed. A visual redesign of the card is out of scope.
- **Deleted:** the files in Risk 1, `config/mock-results.ts`, and their imports.

## 6 — Backend queries and cache keys

- **Now (D2):** nothing in the backend changes. `/api/search-index` already sends `PlantFilterFields` (plan 14); it is public, has no query parameters, and uses the existing `Cache-Control` (1 minute in the app, 1 hour at the edge, purged by dashboard saves). **The selection never goes into a URL**, so there is exactly one cache entry for all filter combinations; the number of filters cannot multiply keys.
- **App-side cache:** the in-memory copy in `lib/search.ts` (5 minutes) is the only other cache; a dashboard save shows up there after at most that time. Filters are state in `results.tsx` and are lost on reload (no persistence, as today).
- **If the catalogue outgrows the index (not built):** add `GET /api/plants/search` with a **canonical query**: params sorted and validated by one zod schema in shared (the same filter keys and shared lists), unknown or empty params rejected or dropped, numbers clamped, so equal filter sets produce the same URL and the edge cache stays bounded. The SQL would filter the JSON list columns with `json_each`, which cannot use an index, so it would be paginated by the primary key with a `LIMIT`; that is why this is a separate plan.

## Testing

No live requests; no deploy; the search index is fetched from the local dev backend only if the user runs it.

1. **Matcher (Node script outside the repo, config and matcher have no RN imports):** a handful of fake `SearchPlant`s covering: sun bar inside / outside / unset / full range; `potSizes` multi-values; toxicity `none` vs animal and the exclusive toggle; seeding ↔ planting clearing each other in both directions; a plant ranges across new year (Nov–Feb) matching winter; `green` yes/no; `related` ordering; `chosenCount` ignores a full sun bar; indoor set ignores `usage` and `seeding` selections.
2. **Typecheck:** `npx tsc --noEmit` in `app/`, looking at the touched files only (Risk 4); `npm run lint`.
3. **Config sanity (script):** every section's filter ids are unique; every option id exists in its shared list; `NO_FILTERS` has a key for every filter.
4. **On a device or web build (user-run):** open both sections, set each filter type, check the badge, «Καθαρισμός», the two sun inputs and the bar stay in sync, seasons clearing, related results label, loading and error states. Needs plants with the new fields filled in the dashboard.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `SEASONS` in shared | `packages/shared/src/plant-fields.ts` |
| 2 | Rewrite the config: types, helpers, `FILTERS`, `filtersFor`, `NO_FILTERS` | `app/src/config/section-filters.ts` |
| 3 | Rewrite the matcher around `Selection` | `app/src/lib/plant-filter-match.ts` |
| 4 | Matcher and config checks (Testing 1, 3) | scratch script, not committed |
| 5 | Generic `SectionFilterSheet`; `SunRangeFilter` takes bounds as props | `app/src/components/results/section-filter-sheet.tsx`, `sun-range.tsx` |
| 6 | `PlantCardData` reduced; card lines updated | `app/src/components/plants/plant-card.tsx` (and `cardFromIndex` users) |
| 7 | Results page on the search index: sections, matches, related, loading/error | `app/src/app/(app)/results.tsx` |
| 8 | Remove dead code after a grep (Risk 1) | `config/plant-filters.ts`, `config/mock-results.ts`, `components/explore/explore-sheet.tsx`, `components/filters/*`, `lib/explore-filters.tsx` |
| 9 | Typecheck and lint the touched files (Testing 2); device check list (Testing 4) | — |

Files **not** touched: all of `backend/` (routes, repo, cache middleware, purge, migrations), the API contract in `packages/shared/src/plants.ts` and `search.ts`, `lib/search.ts` (reused as is), the plant page and other app screens.

## Open items

1. **Toxicity meaning (D7):** the chips read «toxic to». If you want «safe for» (Γάτα = not toxic to cats), say so; it is a two-line change in the config.
2. **Sun fit (D5):** «the plant's bar lies inside my range». The alternative is «overlaps my range» (more results, looser match). Which do you want?
3. **Old Explore/home filter sheet:** the plan deletes it as dead code. Tell me if the home screen is meant to get a short filter set again; it would be another config consumer, not new logic.
4. **Related results (D10):** confirm the label «Παρόμοια αποτελέσματα» and that they appear in both sections.
