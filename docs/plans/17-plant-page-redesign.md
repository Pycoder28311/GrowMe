# 17 — Plant page redesign (on mockup data)

**Goal:** the plant page (`app/src/app/(app)/plants/[id]/index.tsx`) is rebuilt to the structure in `docs/ideas/newFieldPlants.md`: header chips, lifespan instead of the price, four date rows, a sunlight square (exterior plants), info squares (difficulty, usage, time needed, toxicity, pot size), restriction rows (frost, sea salt, wind), «Ηξερες οτι» and «Μυστικο επιτυχιας», a tabbed lifecycle with the care tab and no year range, and a static three-item «Τι να προσέχεις». It runs on **mock plants** from one config file, behind one switch, so moving to the API is flipping that switch.

**Depends on:** plan 14 (the new `Plant`/`PlantSummary` types in `@growme/shared`), plan 16 (`PlantCardData`, `plant-traits.ts` already moved to the new fields). **Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Mock data in config, one seam.** `app/src/config/mock-plants.ts` exports `MOCK_PLANTS: PlantPageData[]` (full `Plant` objects, negative ids). `usePlant(id)` in `lib/plants.ts` returns the mock when `USE_MOCK_PLANTS` (new flag in `config/app.ts`, **true in this branch**) is on or the id is negative; `useCombinationPlants` does the same. Nothing else on the page knows where the data comes from | User |
| D2 | **Data-driven sections.** Every block below is a small reusable component fed by a config list (`HEADER_CHIPS`, `DATE_ROWS`, `TILE_DEFS`, `RESTRICTIONS`, `NOTES`, `WATCH_OUT_ITEMS`, `LIFECYCLE_TAB_DEFS`). Adding a row or tile is one config entry | User |
| D3 | **Header chips** above the name, one row: family, genus (the first word of `scientificName`, plan 14 D12), native area (`native`), plus `privacy` and `evergreen` when true. Built by `ChipRow` from `HEADER_CHIPS` | Default (ideas file; privacy/evergreen placement is mine) |
| D4 | **Lifespan pill replaces the price pill:** `lifespanLabel(min, max)` («4–6 χρόνια»). The price code and `priceLabel` import go | User (ideas file) |
| D5 | **Date rows** under the name: seeding, planting, καρποφορία (fruiting), ανθοφορία (flowering). Seeding and planting read `seedingSeason`/`plantingSeason`; fruiting and flowering are **not in the API yet**, so they are optional mock-only fields of `PlantPageData` (`floweringSeason?`, `fruitingSeason?`). A row with no ranges is hidden. Labels use the existing `plantingPeriod` | User (ideas file); API gap is an Open item |
| D6 | **Sunlight square:** first square, **only when `plant.outdoor`** and a bar is set. Shows the intense bar's hours (`10:00 – 16:00`), the matching `SunIcon` (morning / noon / afternoon) and, below, a phrase computed on the client from `sunPart(start, end)`: «Ιδανικά πρωινό φως», «Ιδανικά μεσημεριανό φως» or «Ιδανικά απογευματινό φως». With no intense bar it falls back to the soft bar. It replaces the old `SunBar` | User (ideas file) |
| D7 | **Info squares** after the sun square, in this order: difficulty, usage, time needed, toxicity, pot size. Each is a `TILE_DEFS` entry: icon, label, value text from the shared label maps, and its animations. A multi-value tile (usage, pot sizes) takes a whole row (the existing rule: more than one art); a plant with no value for a tile hides it | User (ideas file) |
| D8 | **Animations:** existing arts are reused where they fit (usage flags → `food`, `climbing`, `ornamental`, `aromatic`, `succulent`; difficulty → `DifficultyArt` from the hardest level; pot size → `SizeArt`). New simple arts for **time needed** and **toxicity** are drawn from the same `tile-art/layer.tsx` primitives; until drawn, those two tiles show their icon only. Arts of removed tiles (wind, kind, season, frost) stay in `tile-art/` unused | Default |
| D9 | **Restriction rows** (small white rows, one sentence): frost, sea salt («αλατονέφος»), wind. Shown for `big` and `medium` only; `small` and unset are hidden. Sentences per level are in `RESTRICTIONS`. `smallTree` (not shown to users) and the old origin row go. The row component is `TraitRows` made generic (`InfoRows`) | User (ideas file) |
| D10 | **«Ηξερες οτι» and «Μυστικο επιτυχιας»:** two sections after the rows, one `NoteSection` each (`NOTES` list), shown only when the text is set | User (ideas file) |
| D11 | **Lifecycle:** no «Κύκλος ζωής» label and no year-range pill. A row of tab buttons from the shared `LIFECYCLE_TABS` («Από σπόρο», «Μεταφύτευση», «Περιποίηση»); a tab with no stages is hidden. Stages are grouped by `stage.tab` (replaces `stage.seed`). The lit tab, the scroll and the sink-behind animation work as today and are generalised from two groups to an ordered list | User (ideas file); tab count is an Open item |
| D12 | **«Τι να προσέχεις»:** the tips section and `TipsList` data (`plant.tips`) are removed. The section uses the tips' look (white square blocks with a thick soft orange line on the left, long text cut to one line with a fade and opened in `TextPanel`) with **three static blocks** per issue: «Τι βλέπω» (`symptoms`), «Τι είναι» (`what`), «Τι κάνω» (`action`), labels from `WATCH_OUT_ITEMS`. A plant with several issues shows small chips (the issue titles) above the blocks; the first is selected. A block whose text is null is hidden | User (ideas file); layout for several issues is a default |
| D13 | **Page sections** (`sectionsOf`): photos, info, lifecycle, watch-out, description, combinations, ask. The `tips` section is dropped | Default |
| D14 | **Unchanged:** the photo header, the stacked thumbnails, the lightbox, the description band, the combinations carousel, the ask card, `usePageSections` | User |

## 1 — Risks and blockers

1. **Fruiting and flowering dates have no field in the API** (plan 14 Open item 2). D5 keeps them as mock-only extras; when the API adds them, the extras type is deleted and the rows read the real fields.
2. **Mock plants must stay out of production:** `USE_MOCK_PLANTS` is true only on this branch. The release plan has to set it false (or delete `mock-plants.ts` and the branch in `usePlant`). A test in Testing 3 greps for stray mock ids.
3. **The sink-behind animation for three groups** (D11) is the riskiest piece: `stages-box.tsx` is built around two halves with shared values. Fallback if the generalisation is too heavy: the tabs scroll to their group and light up, with no animation for the care tab.
4. **The results cards use real index plants**, which have no mock page. With `USE_MOCK_PLANTS` on, every plant id resolves to a mock (the first one for unknown ids), so tapping any card opens a page.
5. **App-wide compile errors remain in files this plan does not touch** (`plant-icons.ts` keys `nearSea`/`frostHardy`, `plant-tiles.ts`, `tile-art/*`, `lifecycle/*`, `trait-rows.tsx`, `watch-out-list.tsx`, `tips-list.tsx`, the page itself). This plan fixes exactly those, so after it `tsc` should be clean for the whole app.

## 2 — Approach

```
config/mock-plants.ts ──┐
config/app.ts (flag)    ├── lib/plants.ts  usePlant / useCombinationPlants   (the only seam)
                        │
app/(app)/plants/[id]/index.tsx  → composes, in order:
  PhotoHeader (as is)
  title block:  ChipRow · name + LifespanPill · scientific name
  DateRows            ← DATE_ROWS
  PlantTiles          ← TILE_DEFS (SunSquare first, exterior only)
  InfoRows            ← RESTRICTIONS
  NoteSection ×2      ← NOTES
  LifecycleCard       ← LIFECYCLE_TAB_DEFS (tabs, no label, no years)
  WatchOutSection     ← WATCH_OUT_ITEMS
  description · combinations · ask (as is)
```

All config lives in `app/src/config/` with no React Native imports where possible (the labels and tests come from `@growme/shared`), so the row builders can be checked with a plain Node script.

## 3 — Config

- **`config/mock-plants.ts`:** `type PlantPageData = Plant & { floweringSeason?: MonthRange[]; fruitingSeason?: MonthRange[] }`. Three plants cover the cases: an **outdoor** one (both sun bars, usage flags, all three tolerances, all four date rows, three lifecycle tabs, two issues), an **indoor-only** one (no sun square, no seeding row, one tab only), and a **sparse** one (almost nothing set) to prove every block hides itself. Images are `[]` (the page already handles no photos); negative ids; Greek texts. Helper `mockPlant(id)`.
- **`config/plant-page.ts` (new, the page's data-driven lists):**
  - `HEADER_CHIPS: { key, text(plant) => string | null }[]` (family, genus, native, privacy, evergreen).
  - `DATE_ROWS: { key, label, icon, ranges(plant) => MonthRange[] }[]` (seeding, planting, flowering, fruiting).
  - `RESTRICTIONS: { key: ToleranceKey, icon, text: Record<'medium' | 'big', string> }[]` built over the shared `TOLERANCES`; `restrictionRows(plant)` returns the visible rows.
  - `NOTES: { key: 'trivia' | 'secret', title }[]`.
  - `WATCH_OUT_ITEMS: { key: 'symptoms' | 'what' | 'action', title }[]`.
  - `LIFECYCLE_TAB_DEFS`: from the shared `LIFECYCLE_TABS` and `LIFECYCLE_TAB_LABELS`, with each tab's colour.
  - `sunPhrase(start, end)`: `sunPart` → «Ιδανικά … φως».
- **`config/plant-tiles.ts` (rewritten):** `TILE_DEFS: { key, icon, label, build(plant) => { value, arts } | null }[]` and `infoTiles(plant)` that skips the null ones and the sun square's exterior rule. `TileArt` gets `{ kind: 'timeNeeded'; level }` and `{ kind: 'toxicity'; value }`; `potSize` maps onto the existing `size` art.
- **`config/plant-icons.ts`:** keys follow `PlantFlag` again (`greenness`, `evergreen`, no `nearSea`/`frostHardy`); new icons for time needed, toxicity, pot size, frost, salt, wind use the existing icon names where they exist (`wind`, `frost`, `sea`, `gauge`, `ruler`) and add `hourglass`/`paw` only if `ui/icon.tsx` lacks them.
- **`lib/plants.ts`:** the seam in D1.

## 4 — Components (`app/src/components/plants/`)

| Component | Does | Based on |
|---|---|---|
| `chip-row.tsx` (new) | A wrapping row of small pills from `HEADER_CHIPS` | styles of the old price pill |
| `date-rows.tsx` (new) | One line per non-empty `DATE_ROWS` entry: icon, label, the ranges via `plantingPeriod` | replaces `PlantingMonths` |
| `sun-square.tsx` (new) | The sunlight tile: `SunIcon`, the hours, `sunPhrase` below | reuses `sun-icon.tsx`, the tile styles of `plant-tiles.tsx` |
| `plant-tiles.tsx` (edit) | Renders the sun square first (outdoor), then `infoTiles`; drops `PlantingMonths` | itself |
| `trait-rows.tsx` → `info-rows.tsx` | Generic white rows from `{ key, icon, text }[]`; `TraitRows` becomes a thin caller or is deleted | itself |
| `note-section.tsx` (new) | `Section` + `LinkedText` for one note | `ui/section.tsx` |
| `watch-out-list.tsx` → `watch-out-section.tsx` | Issue chips and three static blocks | restyled from `tips-list.tsx` |
| `tips-list.tsx` (edit) | The block look (`TipBlock`, the left line, the fade) is exported as `AccentBlock` so both sections share it; the tips list itself is deleted | itself |
| `lifecycle/*` (edit) | `stage-groups.ts` groups by `stage.tab`; `group-buttons.tsx` → `tab-buttons.tsx` over `LIFECYCLE_TAB_DEFS`; `lifecycle-card.tsx` loses the title and lifespan; `stages-box.tsx` takes an ordered list of groups | itself |
| `sun-graph.tsx` | Deleted once the page no longer imports `SunBar` | — |

## 5 — The page (`plants/[id]/index.tsx`)

- Title block: `ChipRow`, then the name with the lifespan pill, then the scientific name; the price and `priceLabel` import are removed.
- Under it: `DateRows`, `PlantTiles`, `InfoRows` (restrictions), the two `NoteSection`s, in that order, all inside the `info` block.
- `LifecycleCard` no longer gets `lifespan`. `WatchOutSection` replaces `WatchOutList`; the `tips` block and its `Reveal` go; `sectionsOf` loses `tips` and keys the watch-out section on `plant.diseases.length`.
- The page reads `plant` only through `usePlant`, so D1's swap needs no change here.

## Testing

No network calls; the mock flag keeps the page offline.

1. **Config checks (Node script outside the repo):** `restrictionRows`, `infoTiles`, `HEADER_CHIPS`, `DATE_ROWS` and `sunPhrase` over the three mock plants: the outdoor one gives all rows and tiles, the indoor-only one has no sun tile and no seeding row, the sparse one gives nothing and nothing throws. `sunPhrase` for 7–10 (morning), 10–16 (noon), 15–19 (afternoon). Pot sizes and usage give multiple arts.
2. **Typecheck and lint:** `npx tsc --noEmit` clean for the whole app (Risk 5); `npm run lint` on the touched files.
3. **Mock leakage:** grep for `mock-plants` and `USE_MOCK_PLANTS` shows only `config/` and `lib/plants.ts`.
4. **On a device or web build (user-run):** the three mock plants through the whole page — chips, date rows, the sun square on the outdoor plant only, tiles and their animations (Reduce Motion off and on), restriction rows, the notes, each lifecycle tab (lit state, scroll, sink-behind), the watch-out chips and blocks (long text, null text), the description, combinations. Limit: animations and gestures can't be checked from code.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Flag and the seam | `config/app.ts`, `lib/plants.ts` |
| 2 | Mock plants (3 cases) | `config/mock-plants.ts` |
| 3 | Page config lists and `sunPhrase` | `config/plant-page.ts` |
| 4 | Icons follow the new flags; tile defs rewritten | `config/plant-icons.ts`, `config/plant-tiles.ts` |
| 5 | Config checks (Testing 1) | scratch script |
| 6 | `ChipRow`, `DateRows`, `SunSquare`, `NoteSection` | `components/plants/{chip-row,date-rows,sun-square,note-section}.tsx` |
| 7 | `PlantTiles` on the new defs; `InfoRows` from `TraitRows` | `plant-tiles.tsx`, `info-rows.tsx` |
| 8 | New arts for time needed and toxicity (icon only until drawn) | `tile-art/index.tsx`, `tile-art/plants.tsx` |
| 9 | `AccentBlock` extracted; `WatchOutSection` | `tips-list.tsx`, `watch-out-section.tsx` |
| 10 | Lifecycle: tab grouping, `TabButtons`, no label/years, ordered groups in `StagesBox` | `components/plants/lifecycle/*` |
| 11 | Compose the page; update `sectionsOf`; drop price, tips, `SunBar` | `plants/[id]/index.tsx` |
| 12 | Delete dead files (`sun-graph.tsx`, the tips list) after a grep | `components/plants/` |
| 13 | Typecheck, lint, leakage grep (Testing 2–3); device checklist (Testing 4) | — |

Files **not** touched: all of `backend/`, `packages/shared`, the photo header / stack / lightbox, `page-sections.ts`, the results and home screens, `lib/search.ts`.

## Open items

1. **«4-tab lifecycle»:** the ideas file lists three tabs («Από σπόρο», «Μεταφύτευση», «Περιποίηση»); your request says four. What is the fourth? The plan builds the tabs from `LIFECYCLE_TABS`, so a fourth is one entry in the shared list (and the database enum) plus its label; until you say, the page shows three.
2. **Fruiting and flowering dates:** should they become real API fields (a small follow-up to plan 14) or stay mock-only for now (D5)?
3. **Several issues in «Τι να προσέχεις»:** chips above three blocks (D12), or every issue stacked one after the other?
4. **Where privacy and evergreen show:** header chips (D3), or as restriction-style rows?
5. **Mock switch:** keep `USE_MOCK_PLANTS` true for this whole branch, or only for ids below 0?
