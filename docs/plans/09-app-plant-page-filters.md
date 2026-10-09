# 09 — App: plant page and plant filters

**Goal:**
- **Plant page:** the app's plant page shows the fields from plans 07 and 08:
  - chips under the scientific name (yes/no flags, wind, kind, size)
  - a read-only sun graph that says morning, noon or afternoon sun
  - every season
  - the lifespan
  - a **lifecycle timeline**: a vertical line, durations on the left, alternating stages, a «Μεταμφύτευση / Από σπόρο» jump button, random first-line teasers, and «Δες περισσότερα» opening a **full lifecycle page**
- **Filters:** they finally filter, on the phone, from the search index:
  - a short set of 5 in the home Explore sheet
  - the full set in the results «Φίλτρα» sheet
  - kind tabs on the results page
  - matching plants first, then «Σχετικά φυτά» that match some of the filters

**Depends on:** plans 07 and 08 (implemented, migrated and deployed). The live app's plant pages stay broken until a build with this plan ships (plan 07, risk 2).
**Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | One plan for **task 5 (plant page) + task 6 (filters)** | User |
| D2 | **The full lifecycle page** is a real route, `/plants/[id]/lifecycle`, so the phone's Back and swipe-back work. It opens with the search results' "grow from where you tapped" motion, starting from the tapped stage card | User |
| D3 | **Teaser:** while the plant page is focused, every 6–10 s (random) one random stage shows its description's first line for ~4 s, fading in and out. Off with Reduce Motion | User |
| D4 | **Wind, kind and size** show as chips with the flag chips, under the scientific name | User |
| D5 | **The short filter set** (5 filters) lives in the home **Explore** sheet; the **full** set in the results «Φίλτρα» sheet. They share **one selection** (`ExploreFiltersProvider`): what Explore sets is already set in the full sheet | User |
| D6 | **Results tabs** become **kind** tabs: Όλα / Ανθοφόρα / Φυλλώδη / Θάμνοι. They *are* the kind filter (one choice), in sync with both sheets | User |
| D7 | `native` is added to the **search index** (backend + shared type), so filtered cards look like normal ones | User |
| D8 | **Sun filters:** «Ώρες ήλιου» (Λίγες <3 / Μέτριες 3–5 / Πολλές 6+, from `sunLength`) and, in the full set only, «Πότε» (Πρωί / Μεσημέρι / Απόγευμα, from `sunPart`). Each is a single choice and optional | User |
| D9 | **Matching:** a plant must match **every** filter that has a selection; inside one filter, **any** of its chosen options is enough. A plant with no value for a filter (no sun window, no size…) doesn't match it | Default |
| D10 | **«Σχετικά φυτά»:** plants that match at least one but not all active filters, sorted by how many they match (then by name), under a label «Σχετικά φυτά · ταιριάζουν σε N από M φίλτρα». Each plant appears once | Default (ideas file) |
| D11 | **One filter config:** every filter is defined once in `config/plant-filters.ts` (id, label, single or multiple, options, and each option's `test(plant)`). The short and full sets are **lists of ids** from it, and the matcher is a pure `lib/plant-filter-match.ts` with unit tests. A new filter is one entry | Default |
| D12 | **Wind** is stored as its 4 levels. The short set's «Αντέχει αέρα» checkbox is checked when both `WIND_TOLERANT` levels are selected and toggles both, so the two sheets never disagree | Default |
| D13 | **Characteristics:** <br>• the short set: «Αντέχει αέρα», «Ανθεκτικό στον παγετό», «Κοντά στη θάλασσα» <br>• the full set adds «Ιδιότητες»: Βρώσιμο, Αναρριχητικό, Παχύφυτο, Καλλωπιστικό, Ιδιωτικότητα, Μικρό δέντρο, **and Αρωματικό** (it's a flag but missing from the ideas list; see Open items) | Default |
| D14 | **Price** (single choice): the existing ranges (Έως 3 € / 3–6 / 6–10 / 10 €+), matched by **overlap** with the plant's price range (cents ÷ 100). The histogram counts real plants from the index | Default |
| D15 | **Season** (multiple): Χειμώνας / Άνοιξη / Καλοκαίρι / Φθινόπωρο. A plant matches if **any** of its up to 3 month ranges covers a month of the season (`rangesCoverMonth`) | Default (ideas: "season must adjust") |
| D16 | **Removed:** the sample data (`config/plants.ts`, `FILTER_GROUPS`, `CATEGORY_TABS`), the «Άρωμα» and «Τρόπος εγκατάστασης» filters (no data), and the `StepSlider` sun filter. The «Δημοφιλείς αναζητήσεις» become **presets** that set filters: «Μικρή γλάστρα με λουλούδια» = size small + kind flowers; «Μικρό δέντρο για παρτέρι» = Μικρό δέντρο | Default |
| D17 | **The sheets edit a draft;** Explore's «Εμφάνιση φυτών» and the Φίλτρα sheet's Submit apply it. «Καθαρισμός» clears all. The Filters button shows a count badge when filters are set | Default |
| D18 | **No filters and tab «Όλα»:** the results page stays the paged API list (`usePlants`). Otherwise the list comes from the search index (`useSearchIndex`, already cached for the session) | Default |
| D19 | **The "grow from where you tapped" overlay** becomes generic: `ResultFlight` → `components/motion/grow-flight.tsx`, taking its front face as a child, and run by a small `FlightProvider` in `(app)/_layout.tsx`. The search bar and the lifecycle «Δες περισσότερα» both use it. The motion constants stay in `config/search-motion.ts` (copied from the Portfolio; the Portfolio isn't touched) | Default |
| D20 | **Timeline:** <br>• the compact timeline on the plant page has a max height of ~420 px and scrolls inside (`nestedScrollEnabled`) <br>• a stage card shows its title and duration (from sowing); the line marks where «Από σπόρο» and «Μεταμφύτευση» start <br>• odd-numbered stages are shifted right by `space.md` (on the full page too) | Default (ideas file) |
| D21 | **The jump button** shows only when the plant has both seed and plant stages. It starts as «Μεταμφύτευση» (scrolls to the first plant stage), then becomes «Από σπόρο» (scrolls to the first seed stage), and so on. On the full page it is fixed at the bottom | Default (ideas file) |

## 1 — Risks and blockers

1. **A new app build is required:** the live plant pages are broken until it ships. Release it right after this plan (EAS build or update; see Task list).
2. **Nested vertical scrolling** (the timeline inside the page): Android needs `nestedScrollEnabled`, and iOS scrolls the inner view first. If it feels wrong on a device, fall back to "show all stages, no inner scroll" (the full page already exists). Test on a phone, not only on web.
3. **The search index cache** is 5 minutes (server and app): a plant edited in the dashboard filters with old values for up to 5 minutes. Fine; noted.
4. **Expo SDK 57:** check the versioned docs (`AGENTS.md`) before using `useFocusEffect`, `AccessibilityInfo`/`useReducedMotion` and the nested route layout. Expo web keeps an old bundle: restart with `--clear`.
5. **One small backend change** (D7): the search index gets `native`. It is additive and safe to deploy before the app build.

## 2 — Architecture

```
packages/shared  plant-fields.ts (labels, sunLength, sunPart, rangesCoverMonth…)   search.ts (+ native)
        │
app/src
  config/plant-filters.ts      every filter: id, label, one|many, options[{ id, label, test(plant) }]
                               SHORT_FILTERS / FULL_FILTERS / KIND_TABS / PRESETS (ids only)
  lib/plant-filter-match.ts    matchPlantFilters(plants, filters) → { matches, related }   (pure, tested)
  lib/explore-filters.tsx      the one shared selection (draft/apply in each sheet)
  components/filters/*         FilterSection renders any filter by its config (chips / checkboxes / radio)
  app/(app)/results.tsx        tabs + paged list, or filtered list + «Σχετικά φυτά»

  components/plants/plant-badges.tsx    chips under the scientific name
  components/plants/sun-graph.tsx       read-only 24h bar + label
  components/plants/lifecycle/*         timeline, stage card, jump button, teaser hook
  app/(app)/plants/[id]/index.tsx       the plant page (moved from [id].tsx)
  app/(app)/plants/[id]/lifecycle.tsx   the full lifecycle page
  components/motion/grow-flight.tsx + lib/flight.tsx (FlightProvider)
```

## 3 — Backend and shared (small)

- `packages/shared/src/search.ts`: `SearchPlant` gets `native: string | null`.
- `backend/src/resources/search/search.routes.ts`: add `native: p.native` to each plant.
- The plant card shows `stripBlogLinks(native)`, as it does today.

## 4 — Plant page

**Route:** move `app/(app)/plants/[id].tsx` → `app/(app)/plants/[id]/index.tsx`, and add `[id]/lifecycle.tsx`. The links (`/plants/[id]`) stay the same; check the typed routes after an Expo restart.

**Data:** `lib/plants.ts` keeps the plants it has loaded in a small session map (`lastPlants: Map<id, Plant>`). The lifecycle page then shows instantly and refreshes behind it, using the same `usePlant(id)` with an initial value from the map.

**`components/plants/plant-badges.tsx`** (under the scientific name):
- chips from `visibleFlags(plant)` (emoji + phrase)
- then wind, kind and size (`WIND_LABELS`, `PLANT_KIND_LABELS`, `PLANT_SIZE_LABELS`, with 🌬️ / 🌸 / 📏)
- wrapped, the soft green pill style moved from `plant-facts.tsx`
- `accessibilityRole="list"`

**`components/plants/sun-graph.tsx`** (the sun row of the facts card, read-only):
- a 24 h track (night colour at both ends), the window as an orange span, and ticks 00 / 06 / 12 / 18 / 24
- above it the label «6 ώρες ήλιου · Μεσημεριανός ήλιος» (`sunLength`, `sunPart`, `SUN_PART_LABELS`), plus «10:00–16:00» muted
- hidden when no window is set
- `accessibilityLabel` says it in words

**`plant-facts.tsx`:**
- the sun row is the `SunGraph`
- difficulty
- «Φύτεμα: …» with every season (`seasonTrait` already joins them)
- «Ζει …» (lifespan)
- the origin pill stays
- the flag chips move out (to `PlantBadges`)

**Lifecycle** (replaces `life-cycle-card.tsx`), `components/plants/lifecycle/`:
- **`stage-groups.ts`** (pure):
  - `firstOfGroup(stages)` → `{ seed?: index, plant?: index }`
  - `firstLine(content)` → the first non-empty line, with blog links stripped
- **`timeline.tsx` `LifecycleTimeline({ stages, mode: 'compact' | 'full', focusIndex?, onOpen? })`:**
  - each row has a left column (the duration, `durationLabel`, muted small), a centre column (the line and a dot; seed dots are sand-coloured, plant dots green, and a group label sits at each group's start) and a right column (the stage card)
  - odd rows get `marginLeft: space.md`
  - `compact`: `ScrollView` with `maxHeight` and `nestedScrollEnabled`; each card shows title, duration, teaser line and «Δες περισσότερα»
  - `full`: the whole description (`LinkedText`)
  - rows report their `y` (onLayout) so the jump button and `focusIndex` can `scrollTo` them
- **`stage-card.tsx`:**
  - the card measures itself (`measureInWindow`) when «Δες περισσότερα» is pressed and calls `onOpen(index, rect)`
  - the teaser line uses `Animated` opacity and height (Reanimated `FadeIn` / `FadeOut` entering/exiting on a conditional child)
- **`jump-button.tsx`:** «Μεταμφύτευση» ⇄ «Από σπόρο» (D21); `PillButton` style; announces the jump (`accessibilityHint`).
- **`use-teaser.ts`:**
  - `useTeaser(count, enabled)` → the index currently teased or null
  - random stage, 6–10 s gap, 4 s shown
  - timers cleared on blur and unmount (`useFocusEffect`)
  - disabled with `useReducedMotion()` or fewer than 2 stages

**Full page `[id]/lifecycle.tsx`:**
- the title «Κύκλος ζωής · {plant.name}»
- `LifecycleTimeline mode="full"`, scrolled to `focusIndex` (a route param)
- the jump button fixed at the bottom, above the bottom nav
- a «‹ Πίσω» `PillButton` at the top (`router.back()`)
- the top clearance comes from `useTopClearance()`

**Flight:**
- `onOpen(index, rect)` calls `fly({ rect, front: <StageCard … static />, onLanded: () => router.push({ pathname: '/plants/[id]/lifecycle', params: { id, focus: index } }) })`
- `GrowFlight` is `ResultFlight` with the row content replaced by `front`
- `search-bar.tsx` switches to `fly(...)` with `<ResultRowContent>` as the front; its behaviour is unchanged
- with Reduce Motion, the existing fade-only path applies

## 5 — Filters

**`config/plant-filters.ts`:**

```ts
export type PlantFilterData = SearchPlant            // what a test reads
export type FilterOption = { id: string; label: string; test: (p: PlantFilterData) => boolean }
export type FilterDef = { id: FilterId; label: string; select: 'one' | 'many'; options: FilterOption[] }

FILTERS: kind · size · price · sun-length · sun-part · season · wind · traits (frostHardy, nearSea) · properties (7 flags)
SHORT_FILTERS = ['size', 'sun-length', 'price', 'traits+windTolerant', 'kind']   // Explore
FULL_FILTERS  = ['price', 'size', 'sun-length', 'sun-part', 'season', 'wind', 'traits', 'properties']  // kind = tabs
KIND_TABS     = [{ id: 'all' }, …PLANT_KINDS]
PRESETS       = [{ label: 'Μικρή γλάστρα με λουλούδια', filters: { size: ['small'], kind: ['flowers'] } }, …]
```

- Option labels come from shared (`PLANT_SIZE_LABELS`, `WIND_LABELS`, `PLANT_FLAGS[].label`, `SUN_PART_LABELS`…).
- The short set's characteristics filter is the `traits` filter plus a virtual option `wind-tolerant` that reads and writes `wind` (D12). This is handled in one helper, `shortTraitsValue` / `toggleShortTrait`.

**`lib/plant-filter-match.ts`:**
- `activeFilters(filters)` → the ids with a selection
- `matchesFilter(plant, def, selected)` → true if any selected option's `test(plant)` passes
- `matchPlantFilters(plants, filters)` → `{ matches, related: { plant, count }[] }` (D9, D10)
- **unit tests** (scratch `tsx` script, like `matchSearch`):
  - every filter
  - a plant with null values
  - season across 3 ranges and across the new year
  - price overlap
  - the order of related plants
  - the wind checkbox both ways

**`lib/explore-filters.tsx`:**
- `Filters` (`Record<FilterId, string[]>`, a single choice = an array of ≤1) moves here from `config/filters.ts`
- adds `clear()` and `count`

**Components** (`components/filters/`):
- `filter-section.tsx` renders any `FilterDef`:
  - `one` → chips (tap again to clear)
  - `many` → `Checkbox` list, or chips when short
  - `price` keeps `PriceFilter` with a real histogram (counts from the index; `PRICE_MAX` from the data)
- `filter-sheet.tsx`:
  - renders `FULL_FILTERS` into a draft from `useExploreFilters()`
  - Submit applies, «Καθαρισμός» clears the draft
  - presets at the end
- `filters-button.tsx`: an optional `count` badge.
- `components/explore/explore-sheet.tsx`: renders `SHORT_FILTERS` with `FilterSection` (no more `FILTER_GROUPS`); «Εμφάνιση φυτών (N)» shows how many plants match, computed live from the index when it's loaded.

**`app/(app)/results.tsx`:**
- the tabs come from `KIND_TABS`, bound to `filters.kind`
- with no active filter: today's paged `usePlants` list
- otherwise:
  - `useSearchIndex()`; call `load()` on mount
  - a `SectionList` with the matches, then the «Σχετικά φυτά» header and the related plants
  - empty states: «Κανένα φυτό με όλα τα φίλτρα» (only related shown) or «Κανένα φυτό» with a «Καθαρισμός φίλτρων» button
  - error / retry as in the search
- **`PlantCard`:** takes `PlantCardData`, a `Pick` of the fields it shows plus `cover: string | null`, with two adapters:
  - `cardFromSummary(PlantSummary)` (cover = `images[0]?.url`)
  - `cardFromIndex(SearchPlant)` (cover = `image`)

## Testing

- **Unit** (scratch, `tsx`):
  - `matchPlantFilters` and the filter tests (§5)
  - `firstLine`, `firstOfGroup`
  - `useTeaser` timing with fake timers, if simple
- **Expo web + Playwright**, with the harness from plans 07 and 08:
  - local wrangler with `--local-upstream localhost:8787`
  - the app's production calls routed to it, with the CORS headers added
  - a local test user marked verified in the local D1
  - sign-in with `origin: http://localhost:8081` and the secure session cookie name
  - wait for the auth rate limit; open plants through in-app navigation, because a full reload lands on home
  - seed local plants through the admin API with varied fields
- **Plant page:**
  - the chips (including no-phrase flags hidden)
  - the sun graph label and position
  - several seasons and the lifespan
  - timeline order, offsets and group labels
  - the jump button scrolls and changes its name; it's hidden with one group
  - a teaser appears within ~10 s (speed timers in the test via a dev-only param, or just wait)
  - «Δες περισσότερα» → flight → `/plants/:id/lifecycle` focused on that stage, full texts, bottom jump button, Back returns
- **Filters:**
  - Explore picks size + «Αντέχει αέρα» → results show only matches; the full sheet shows the same selection, with wind strong+moderate checked
  - kind tabs filter and stay in sync with the sheets
  - related plants appear under their label with the right counts
  - season matches a second range
  - price histogram bars are real
  - presets
  - clearing returns to the paged list
- **Device check** (Expo Go or a dev build): nested timeline scroll on Android and iOS, the flight, Reduce Motion on.
- **Checks:** `npx tsc --noEmit` and `npx expo lint` in `app`; `tsc` in `backend` and `packages/shared`.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Search index: `native` | `packages/shared/src/search.ts`, `backend/src/resources/search/search.routes.ts` |
| 2 | Generic flight: `GrowFlight` + `FlightProvider`; search bar uses it | `components/motion/grow-flight.tsx`, `lib/flight.tsx`, `app/(app)/_layout.tsx`, `components/search/*` |
| 3 | Route move and plant cache | `app/(app)/plants/[id]/index.tsx`, `lib/plants.ts` |
| 4 | `PlantBadges`, `SunGraph`; `PlantFacts` update | `components/plants/plant-badges.tsx`, `sun-graph.tsx`, `plant-facts.tsx` |
| 5 | Lifecycle: helpers, card, timeline, jump button, teaser; remove `life-cycle-card.tsx` | `components/plants/lifecycle/*` |
| 6 | Full lifecycle page and the flight into it | `app/(app)/plants/[id]/lifecycle.tsx` |
| 7 | Filter config, matcher, unit tests | `config/plant-filters.ts`, `lib/plant-filter-match.ts`, scratchpad |
| 8 | Shared selection: `Filters` type, clear, count | `lib/explore-filters.tsx` |
| 9 | `FilterSection`, Filter sheet (full), Explore sheet (short), button badge, presets, real price histogram | `components/filters/*`, `components/explore/explore-sheet.tsx` |
| 10 | Results: kind tabs, filtered list + «Σχετικά φυτά», `PlantCardData` | `app/(app)/results.tsx`, `components/plants/plant-card.tsx` |
| 11 | Remove sample data and old configs | `config/plants.ts`, `config/filters.ts`, `config/results-filters.ts`, `assets/images/plants/*` (if unused) |
| 12 | Tests (web + device), typecheck, lint | scratchpad |
| 13 | **With approval:** deploy the backend (index `native`), commit, new app build (EAS) | — |

**Files not touched:**
- `Personal/Portfolio` (read only; the motion constants are already copied)
- `Experiments/plant demo`
- the TakeTheTrip codebase
- the dashboard (plans 07 and 08)
- the database and migrations

## Open items

- **Αρωματικό in the filters:** your filter list doesn't name it, but it is a flag. It's included in «Ιδιότητες» (D13); say if it should be left out.
- **Presets** (D16): two to start; say if you want others.
- **Sun length buckets** (<3 / 3–5 / 6+): adjust the limits if you prefer.
- The sample plant photos in `assets/images/plants/` are removed only if nothing else uses them.
