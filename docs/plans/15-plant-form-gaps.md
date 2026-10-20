# 15 — Plant dashboard form: closing the gaps

**Goal:** the dashboard plant form (`backend/src/resources/admin/plants/plants.admin.tsx`), which plan 14 made work for every new field, gets the missing behavior and layout: usage flags in their own group, toxicity «none» that excludes cat/dog in the page, an indoor/outdoor rule, exterior-only sections that dim when outdoor is off, a richer list card, and a recorded check of create, edit and delete. The API, database and cache code do not change.

**Depends on:** plan 14 (merged). **Blocks:** nothing (the app plan reads the same API).

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Refine, don't rebuild.** The engine in `admin.client.js` (`RepeatableList`, `collect()`, error display, dirty flag) and the components in `ui/fields.tsx` stay; changes are small and generic so blogs and combinations keep working | Default |
| D2 | **Indoor/outdoor:** at least one must be on. Enforced in shared zod (`plantFields` refinement, reused by `plantCreate`, `plantUpdate`, `plantSave`) so the API and the dashboard agree; the form also shows the error under the toggles | Default |
| D3 | **Exterior-only sections** (usage flags, seeding season, sun bars; the app page shows them only for exterior plants) are **dimmed and collapsed with a note when «Εξωτερικός χώρος» is off, but still saved**. Turning it back on loses nothing | Default |
| D4 | **Toxicity:** picking «Κανένα» unchecks cat and dog; picking cat or dog unchecks «Κανένα». The server rule (`none` alone) stays as the safety net | Default |
| D5 | **Care tab:** «περιποίηση» stays a third stage group at the bottom of the lifecycle list, no switch button; seed ⇄ plant keep theirs. Every stage keeps the optional time range. (Plan 14 open item 1; still unconfirmed) | Default |
| D6 | **Usage flags** are rendered from `PLANT_USAGE_FLAGS` (shared) as their own «Χρήση» group; the remaining flags (`privacy`, `evergreen`, `indoor`, `outdoor`) stay in «Χαρακτηριστικά». The split is computed from the two shared lists, so a new usage flag needs no form change | Default |
| D7 | **Conditional sections** use a generic `data-when="<field>"` attribute on a wrapper: `admin.client.js` toggles `.dimmed` (and `inert` on its inputs) from the checkbox with that `data-field`. It is not plant-specific | Default |
| D8 | **List card:** third line with place badges (🏠 / 🌤️) and the emoji of the usage flags that are on; difficulty stays on line two | Default |
| D9 | **Cache:** unchanged. Create, update and delete already go through `resource.tsx`, which calls `purgeApiCache` after every write. The checks in Testing only verify that this still happens | Default |

## 1 — Risks and blockers

1. **Never run in a browser yet.** Plan 14 only typechecked and unit-checked the dashboard. Expect small layout and wiring bugs; they are what Testing 3 is for.
2. **Dashboard access in dev:** `requireAccess` needs a Cloudflare Access token, so the form cannot be opened locally as is. Testing uses a local-only route test (see Testing 2) or a temporary local bypass that is **not committed**. No request goes to Cloudflare, and no purge runs (`CF_PURGE_TOKEN`, `CF_ZONE_ID`, `API_HOST` are unset locally, so `purgeApiCache` returns at once).
3. **D2 touches the API contract** (`plants.ts` in shared): a client that sends both `indoor` and `outdoor` false now gets `400`. No stored plant has both off (the column defaults are on), so existing data is fine.
4. **Dimmed ≠ cleared (D3):** a plant marked indoor-only can still carry usage flags and seasons. The app plan must ignore them for indoor-only plants; note it there.

## 2 — Approach

```
shared/plants.ts        + indoorOrOutdoor refinement (D2)
admin/ui/fields.tsx     Toggle gets data-when support via a wrapper component
admin/ui/pages.tsx      FormSection accepts `when`
admin.client.js         + conditional sections (D7) + exclusive choices (D4)
plants.admin.tsx        regroup form, usage group, list card
ui/styles.ts            .dimmed, group captions
```

## 3 — Details

### Shared: placement rule (`packages/shared/src/plants.ts`)
- `placed = (p: { indoor?: boolean; outdoor?: boolean }) => p.indoor === undefined || p.outdoor === undefined || p.indoor || p.outdoor`, message «Διάλεξε εσωτερικό ή εξωτερικό χώρο», `path: ['outdoor']`.
- Applied with `.refine` next to the sun and lifespan refinements in `plantCreate`, `plantUpdate` and `plantSave` (same pattern as `lifespanInOrder`).

### Form regrouping (`plants.admin.tsx`)
Order, matching the app page: photos → name / scientific name / family → «Χώρος» (indoor, outdoor toggles + error slot) → «Χαρακτηριστικά» (the other non-usage flags, then frost / salt / wind) → «Χρήση» (usage toggles, `when="outdoor"`) → «Φως» (two sun bars, `when="outdoor"`) → «Φροντίδα» (pot sizes, difficulty, time needed, toxicity) → origin and lifespan → seasons (seeding `when="outdoor"`, planting always) → lifecycle → «Τι να προσέχεις» → trivia / secret → description → combination.
- Splits `PLANT_FLAGS` with `PLANT_USAGE_FLAGS` (D6); a small local helper `togglesOf(keys)` renders `Toggle`s so the three groups share code.
- Place toggles carry the `indoor`/`outdoor` keys already in `PLANT_FLAGS`.

### Conditional sections (generic)
- `FormSection` (`ui/pages.tsx`) and the plain `<div class="card">` wrappers get an optional `when` prop that renders `data-when="outdoor"` and a muted note «Μόνο για εξωτερικά φυτά» shown while dimmed.
- `admin.client.js`: one function `applyWhen()` runs on start and on every `input`; for each `[data-when]` it finds `input[data-field="<name>"]` and toggles `.dimmed` and `inert`. Dimmed inputs are still read by `collect()` (D3), so nothing is dropped.
- `styles.ts`: `.dimmed { opacity: .45 }` plus the note.

### Exclusive choices (D4)
- `MultiChoices` (`ui/fields.tsx`) gets an optional `exclusive?: string` prop (the value that excludes the others), rendered as `data-exclusive="none"` on the group.
- `admin.client.js`: on `change` inside a `[data-multi][data-exclusive]`, checking the exclusive value unchecks the others and checking another unchecks the exclusive one. `potSizes`, `difficultyLevels` and `timeNeeded` don't set it.

### Lifecycle (D5)
No structural change. Check and fix in the browser: the three add buttons, seed ⇄ plant switch moving a stage across the group edge, care stages staying last, the optional time range empty → `null`, and the server's «tab order» error landing on the right stage (path `lifecycles.N.tab`; the hidden `tab` input has a `.field` wrapper with an `.error` slot already).

### List card (D8)
`PlantListItem`: lines = scientific name · difficulty labels · `🏠 🌤️ 🍅 🌿 …`, built from `item.indoor`, `item.outdoor` and `PLANT_FLAGS` filtered by `PLANT_USAGE_FLAGS`. No extra query: all those fields are already in `PlantSummary`.

## 4 — Cache and delete

- No code change. The save routes (`POST /api/admin/plants`, `PUT /api/admin/plants/:id`) and `DELETE /api/admin/plants/:id` each call `purgeApiCache` through `waitUntil` (`resource.tsx`). `plantsRepo.remove` cascades lifecycles, diseases and image links and deletes the photos.
- The plan adds no new URL, no query parameter and no new `Cache-Control`.

## Testing

No Cloudflare calls at any step (no deploy, no remote D1, no purge).

1. **Typecheck:** `npm run typecheck` in `packages/shared` and `backend`; `npx tsc -p admin-editor/tsconfig.json --noEmit`.
2. **Server rendering without Access:** a scratch script (kept outside the repo) that renders `PlantForm` for a new plant and for a full plant and checks the HTML contains the groups, `data-when`, `data-exclusive`, the three stage groups and every `data-field` of the save schema. Limit: the Worker's text-module imports (`layout.tsx`) don't load under plain `tsx`, so this may need the build step or a stub for them.
3. **Browser run (local dev server, local D1, a temporary uncommitted Access bypass):** create a plant with every new field; edit it and reorder seasons and stages; delete it. Watch that: toxicity exclusivity works; outdoor off dims the three sections and the values still save; indoor and outdoor both off shows the error under the toggles; each server error (sun bar, season count, stage order, disease text) appears on the right field. Apply `0017` to the local D1 first (`wrangler d1 migrations apply … --local`).
4. **Purge:** with the purge settings unset the call is a no-op; confirm in code that all three write routes still reach it (grep `purgeApiCache` in `resource.tsx`). The real purge can only be checked after a deploy and is out of scope.
5. **Regression:** open the blog and combination dashboard forms (they share `admin.client.js`, `fields.tsx`, `pages.tsx`) and save one of each.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `placed` refinement on create, update and save | `packages/shared/src/plants.ts` |
| 2 | `exclusive` on `MultiChoices`; `when` support on sections | `backend/src/resources/admin/ui/fields.tsx`, `ui/pages.tsx` |
| 3 | `applyWhen()` and exclusive choices in the form engine | `backend/src/resources/admin/admin.client.js` |
| 4 | `.dimmed` and note styles | `backend/src/resources/admin/ui/styles.ts` |
| 5 | Regroup the plant form (place, characteristics, usage, light, care, …); toxicity `exclusive="none"` | `backend/src/resources/admin/plants/plants.admin.tsx` |
| 6 | Richer list card | `backend/src/resources/admin/plants/plants.admin.tsx` |
| 7 | Typecheck and server-render check (Testing 1–2) | scratch script |
| 8 | Browser run and fixes (Testing 3, 5) | whatever the run finds |
| 9 | Note for the app plan: ignore exterior-only data on indoor-only plants | `docs/plans/14-plants-data-model-backend.md` (one line) |

Files **not** touched: the database and migrations, `plants.repo.ts`, `plants.save.ts`, `plants.columns.ts`, `lib/crud.ts`, `lib/purge.ts`, `middleware/` (including `access.ts` and `edge-cache.ts`), the public API routes, the app.

## Open items

1. **Care tab** (D5): confirm it is a third stage group. If it is something else (for example a separate text), tell me before the lifecycle task.
2. **Indoor/outdoor rule** (D2, D3): confirm "at least one" and "dim, keep data". The alternatives are no rule, or clearing the hidden values.
3. **Browser check** (Testing 3): it needs a temporary local bypass of the Cloudflare Access check. Say if you prefer another way to open the form locally.
