# 19 — Filters, sun square, watch-out rows, plant cards, nutrition and cook tip

**Goal:** seven changes on the plants pages and the plant dashboard form: a brighter flower on the plants list, the «Χρόνος φροντίδας» filter label, no «Εποχή φύτευσης» filter for indoor plants, a sun square that shows the hour span and the part of the day, plant cards in mostly black text, «Τι να προσέχεις» as stacked accordion rows, and two new fields («Θρεπτική αξία», «Συμβουλή μαγειρικής») for aromatic and ornamental plants, in the database, the form and the plant page.

**Depends on:** plan 14 (data model), plan 15 (form `data-when`), plan 17 (plant page). **Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Sun span is a stored field** `sunHours` (whole hours, 1–15), one per plant, set in the dashboard. The app does not show it as one number: it shows the **range `sunHours − 1` to `sunHours + 1`** («3–5 ώρες» for 4), the low end never below 1, the high end never above 15 | User |
| D2 | **The sun square's caption stays the part of the day** («Ιδανικά πρωινό / μεσημεριανό / απογευματινό φως»), still worked out from the plant's existing start and end hours (`sunPart`). The start and end hours stay: the results filters and the part of the day read them. The `HH:00 – HH:00` value is replaced by the hour range | User (+ default for what stays) |
| D3 | **«Τι να προσέχεις» becomes stacked accordion rows:** one full-width row per issue, one under the other, each with a chevron button. Tapping a row opens it in place and shows its «Τι είναι» and «Τι κάνω» blocks right under that row. «Τι βλέπω» (symptoms) shows in the row itself as its subtitle, so it is always visible | User (accordion) + default for «Τι βλέπω» |
| D4 | **Nutrition and cook tip:** two optional long-text fields, for plants flagged `aromatic` or `ornamental`. They live next to `trivia` and `secret` (`Plant`, not `PlantSummary`, so lists stay small). The plant page shows each as its own section only when the plant has the flag and the text is filled | User |
| D5 | **Dashboard form:** the two fields sit in one card that dims (`data-when`) unless «Αρωματικό» or «Καλλωπιστικό» is on. `data-when` today reads one checkbox, so it gets a small generic extension to read a list (`data-when="aromatic ornamental"` = either) | Default |
| D6 | **Filter label:** only the filter in the results sheet changes to «Χρόνος φροντίδας» (`config/section-filters.ts`). The info tile (`config/plant-tiles.ts`) and the dashboard form keep «Χρόνος που θέλει» / «Χρόνος που χρειάζεται» until you say otherwise | Default (see Open items) |
| D7 | **«Εποχή φύτευσης»** stays for outdoor plants and goes from the indoor section (`sections: ['outdoor']`). The seeding filter is already outdoor only | Default |
| D8 | **Plant cards «mostly black»:** the card's text already uses `colors.ink`. The grey and green parts change: the trait icons (`inkMuted`) and the «Δες περισσότερα» link and arrow (`colors.primary`, olive) become ink. The season pill and the photo placeholder keep their colours | Default |
| D9 | **«Center left flower, brighter»:** the results page's left flower at `y: 650` (a leaf of the plant page's shapes turned into a flower in `FLOWERS_ONLY`). It gets a higher opacity and one of the squares' stronger flower colours | Default |

## 1 — Risks and blockers

1. **Migration on D1 (remote).** Three new columns (`sun_hours`, `nutrition`, `cook_tip`) need `backend/drizzle/0018_*.sql` (columns only added, no table rebuild, as in 0017) applied to the remote `growme-db`. Back up first. Existing plants get `NULL`, so the sun square would have no span until each plant is edited; D1 therefore needs a fallback (Task 6).
2. **Edge cache.** The API caches plant responses by URL and `_cv`. After the deploy, bump `CACHE_VERSION` in `backend/src/middleware/edge-cache.ts` (as before), or the app reads old plants without the new fields.
3. **Sun fallback for plants without `sunHours`:** show the existing `HH:00 – HH:00` value (as today) instead of nothing. The span is the new preferred display, not a requirement.
4. **Old apps.** A shared-package change (`plantFields`) is backward compatible: the new fields are nullable and default to `null`.

## 2 — Approach

```
packages/shared/src/plants.ts      sunHours, nutrition, cookTip in plantFields, plantFieldDefaults, Plant/PlantSummary types
backend/src/db/schema.ts           3 columns        →  backend/drizzle/0018_*.sql (+ meta snapshot/journal via drizzle-kit generate)
backend/src/resources/plants/*     repo + columns map the new fields
backend/src/resources/admin/…      form: «Ώρες ήλιου» next to the sun bars, nutrition + cook tip card (data-when)
app/src/api/plant-shape.ts         read the three fields
app/src/config/plant-page.ts       sunHoursRange(), NUTRITION_ITEMS, WATCH_OUT_ITEMS (two blocks)
components: sun-square, watch-out-section, new NutritionSection, plant-card
config: section-filters, results.tsx
```

## 3 — Changes per area

### 3.1 Plants list: brighter center-left flower
`app/src/app/(app)/results.tsx`, `FLOWERS_ONLY`: the entry produced from the left leaf (`y: 650`) gets `opacity` 0.6 → about 0.95 and `color` from `SQUARE_FLOWER_COLORS` (the stronger one), without touching the other flowers. Written as an explicit entry instead of the `map` rule, so it is easy to tune.

### 3.2 Filter label
`config/section-filters.ts`, the `time` filter: `label: 'Χρόνος φροντίδας'`.

### 3.3 «Εποχή φύτευσης» outdoor only
`config/section-filters.ts`, the `planting` filter: `sections: ['outdoor']`. `NO_FILTERS` and the sheets are built from `FILTERS`, so nothing else changes. `lib/plant-filter-match.ts` ignores a filter that is not in the section; verify it does not read `planting` for indoor selections (a selection saved from before).

### 3.4 Sun square: hour span and part of the day
- Shared: `sunHours: z.number().int().min(1).max(15).nullable()` in `plantFields`; `sunHours: null` in the defaults; `sunHours: number | null` in `PlantSummary`. A helper `sunHoursRange(hours)` in `plant-fields.ts` returns `[max(1, h − 1), min(15, h + 1)]` and a label «3–5 ώρες» (so the admin preview and the app use the same text).
- Backend: `sun_hours` integer column; repo/columns map it (same place as `sunSoftEnd`).
- App: `api/plant-shape.ts` reads it with `num()`; `config/plant-page.ts` `sunSquareOf` also returns the label; `components/plants/sun-square.tsx`: `value` = the range label (fallback: the clock hours), `caption` = `sunPhrase(bar)` (unchanged, the morning/noon/afternoon text), `label` stays «Ήλιος» / «Απαλό φως».
- Dashboard: next to the sun bars (`plants.admin.tsx`, the card at line ~215) a number input «Ώρες ήλιου», with the computed range printed under it, in the same `data-when="outdoor"` card.

### 3.5 Plant cards in mostly black
`components/plants/plant-card.tsx`: trait icon `colors.inkMuted` → `colors.ink`; «Δες περισσότερα» text and chevron `colors.primary` → `colors.ink`. Nothing else.

### 3.6 «Τι να προσέχεις» as accordion rows
`components/plants/watch-out-section.tsx` is rewritten:
- One `Pressable` row per `plant.diseases` entry, stacked (no pills, no horizontal scroll, no `pickedId`). Each shows the issue title, the «Τι βλέπω» text (first lines) and a chevron that turns when open (reuse the results page's arrow animation idea, `useAnimatedStyle` rotate).
- State: `openId` (one open at a time, tapping the open one closes it). The body under the row uses `AccentBlock` for «Τι είναι» and «Τι κάνω»; `WATCH_OUT_ITEMS` in `config/plant-page.ts` loses its `symptoms` entry (it moves into the row).
- The long-text panel (`TextPanel`) behavior stays for a long block.
- `accessibilityRole="button"`, `accessibilityState={{ expanded }}`.
- No layout animation on height (the app removed those transitions): the body appears with the existing fade (`FadeIn`), the row does not move.

### 3.7 Nutrition and cook tip
- Shared: `nutrition: longText.nullable()`, `cookTip: longText.nullable()` in `plantFields`; defaults `null`; `Plant` type next to `trivia`/`secret`.
- Backend: `nutrition`, `cook_tip` text columns in `schema.ts`, `plants.repo.ts` (the same place as `secret`), migration 0018.
- Dashboard: one card under «Μυστικό επιτυχίας» (`plants.admin.tsx`, line ~321) with two `TextArea`s, labels «Θρεπτική αξία» and «Συμβουλή μαγειρικής», in a wrapper `data-when="aromatic ornamental"`; `admin.client.js` (around line 710) learns to read a space-separated list.
- App: `api/plant-shape.ts` reads them; `config/plant-page.ts` gets `NUTRITION_ITEMS` (key, title, icon `food`, tone, and the flags it needs); a new `components/plants/nutrition-section.tsx` renders a section per filled item using the same `NoteSection` card look (so no new styles), placed after the notes in `app/(app)/plants/[id]/index.tsx` (line ~181). `mock-plants.ts` gets sample values for one aromatic and one ornamental plant.

## Testing

- `npx tsc --noEmit` in `app/`, `backend/` and `packages/shared`; `npx eslint` on the touched files.
- Shared: unit check that `sunHoursRange(1) = [1, 2]`, `(4) = [3, 5]`, `(15) = [14, 15]`.
- Migration: apply 0018 to a local D1 copy first (`wrangler d1 migrations apply --local`); confirm existing plants keep every value. Remote apply only after the user says so.
- Dashboard (needs the local Access bypass of plan 15, not committed): the nutrition card dims with both flags off, wakes with either; create and edit save the three fields; the range text updates while typing.
- App on web (`localhost:8081`): plant with `sunHours` shows the range and the day part; one without it shows the clock hours; the watch-out rows open one at a time; an indoor results sheet has no «Εποχή φύτευσης»; an aromatic and an ornamental plant show their sections, a plain one shows none.
- Limits: animations and the flower's brightness are judged by eye; nothing here can be checked by the type checker.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Brighter center-left flower | `app/src/app/(app)/results.tsx` |
| 2 | Filter label and indoor planting filter | `app/src/config/section-filters.ts` |
| 3 | Plant card text colors | `app/src/components/plants/plant-card.tsx` |
| 4 | Shared fields and the range helper | `packages/shared/src/plants.ts`, `plant-fields.ts` |
| 5 | Columns, migration, repo, cache version | `backend/src/db/schema.ts`, `backend/drizzle/0018_*.sql` (+ meta), `plants.repo.ts`, `plants.columns.ts`, `middleware/edge-cache.ts` |
| 6 | Sun square: range value and part-of-day caption, with the clock-hours fallback | `app/src/api/plant-shape.ts`, `config/plant-page.ts`, `components/plants/sun-square.tsx` |
| 7 | Dashboard form: «Ώρες ήλιου», nutrition card, `data-when` list | `backend/src/resources/admin/plants/plants.admin.tsx`, `admin.client.js` |
| 8 | Watch-out accordion rows | `components/plants/watch-out-section.tsx`, `config/plant-page.ts` |
| 9 | Nutrition section on the plant page, mock data | `components/plants/nutrition-section.tsx`, `app/(app)/plants/[id]/index.tsx`, `config/plant-page.ts`, `config/mock-plants.ts` |
| 10 | Checks from Testing; deploy and remote migration only when asked | — |

Files **not** touched: `theme/*` (colors and tokens), the lifecycle tabs, the blog and community screens, `backend` auth, the search index (`packages/shared/src/search.ts`: `sunHours` is not a filter).

## Open items

1. **One `sunHours` or one per bar?** The plan uses one number for the plant's displayed light (the intense bar, else the soft one). If the soft bar needs its own span, it becomes two columns.
2. **«Χρόνος φροντίδας» elsewhere:** also rename the info tile («Χρόνος που θέλει») and the dashboard label, or only the filter (D6)?
3. **Which text counts as «Τι βλέπω»** in the accordion row (D3): the whole symptoms text cut to two lines, or its first sentence?
4. **Existing plants** have no `sunHours`: fill them by hand in the dashboard, or derive a first value from `end − start` in the migration (a one-line `UPDATE`)?
