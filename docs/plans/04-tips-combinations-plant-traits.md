# 04 — Tips library, combination form, text plant traits

**Goal:**
- **Συμβουλές:** a dashboard page with list, create, edit and delete. Tips become a reusable library:
  the plant form either **picks an existing tip from a searchable dropdown** or writes a new one.
- **Συνδυασμοί:** a form with title, description and the plants in the combination.
- **Food / native / seeds:** become **text** fields with suggested values in the dashboard. The app's
  cards and plant page show each with its emoji and its text.

**Depends on:** plan 02 (admin resources, forms, `syncChildren`) and the remote migrations 0005–0007.
**Blocks:** nothing. Plan 03 (community) is independent.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Tips are a **library**: `tips` loses `plant_id` and `position`. A new link table `plant_tips (plant_id, tip_id, position)` connects tips to plants in order. One tip can be on many plants | User |
| D2 | In the plant form, a **picked** tip is shown read-only, with an «Επεξεργασία» link to its page. **New** tips are written inline (title + text) and created on save. Shared tips are edited only on the Συμβουλές page | User |
| D3 | ✕ on a tip in the plant form unlinks it; **if no other plant uses it, the tip is deleted** in the same save | User |
| D4 | Combination form: title, description, and a **multi-select of its plants** (search + checkboxes). It sets each plant's `combination_id`. A plant is in at most one combination, so picking a plant that belongs to another combination moves it (the row shows «στο “X”»). The plant form keeps its own combination dropdown | User |
| D5 | `food`, `native` and `seeds` become **nullable text** (max 60). Empty means not shown. The dashboard input is free text with **suggestions** (below) | User |
| D6 | Suggestions — 🍅 food: Φαγώσιμο · Τρώγονται τα φύλλα · Τρώγεται ο καρπός · Αρωματικό για μαγείρεμα · Μη φαγώσιμο · Τοξικό. 🌰 seeds: Από σπόρο · Από φυτό · Σπόρος ή φυτό · Από μόσχευμα · Από βολβό. 📍 native: Ιθαγενές της Ελλάδας · Ιθαγενές της Μεσογείου · Εισαγόμενο | User |
| D7 | Existing values convert: food yes→«Φαγώσιμο», no→empty · seeds yes→«Από σπόρο», no→«Από φυτό» (what the app shows today) · native yes→«Ιθαγενές της Ελλάδας», no→empty | User |
| D8 | Column names stay `food`, `native` and `seeds`, so the API fields keep their names; only their type changes. The shared `PLANT_TRAIT_SUGGESTIONS` constant lives in `packages/shared`, so the dashboard uses the same list | Default |
| D9 | Suggestions are a native `<datalist>` on a text input: no script needed, works with the keyboard, CSP-safe | Default |
| D10 | Search in the tip dropdown and the plants multi-select is **client-side**, over a list the form page loads once. Fine up to a few thousand rows; see Open items | Default |
| D11 | The Συμβουλές card is added to the dashboard home (`TABLES` in `admin.repo.ts`); Σημειώσεις stays list + delete (users' private notes) | Default |

## 1 — Risks and blockers

1. **Two hand-written migrations** (drizzle-kit would rebuild tables, and on D1 that cascades and
   deletes children; see 0006):
   - **0008 — tips:** create `plant_tips`, copy `(plant_id, id, position)` from `tips`, then rebuild
     `tips` without `plant_id`/`position`. Safe, because nothing references `tips` except the new link
     table, which is created **after** the rebuild. Order: copy the links into a backup → rebuild `tips`
     → create `plant_tips` → insert from the backup → drop the backup.
   - **0009 — traits:** no rebuild. For each column: `ADD food_t TEXT` → `UPDATE … CASE` (D7) →
     `ALTER TABLE plants DROP COLUMN food` (allowed: no index, FK or CHECK uses it) → `RENAME COLUMN
     food_t TO food`. Then update the Drizzle snapshot (`drizzle-kit generate` after the schema edit,
     replacing the generated SQL with this).
   - Test both on a scratch DB with real rows (plants with images, lifecycles, tips, diseases) and check
     every count before and after, as was done for 0006.
2. **API change for apps:** `Plant.tips` items lose `plantId`/`position`; `food`/`native`/`seeds`
   become `string | null`. The app is updated in the same change. Old phone builds would show
   «Από σπόρο» for any truthy string (harmless) until the new build.
3. **Public `/api/tips` routes** change shape: no `?plantId=` filter, and `tipCreate` without
   `plantId`. Nothing in the app calls them today (checked: the app reads tips through
   `/api/plants/:id`).
4. Remote migrations 0005–0007 must already be applied, then 0008 and 0009, with the user's approval.

## 2 — Architecture

```
plants ──< plant_tips (plant_id, tip_id, position) >── tips (id, title, content)
plants.combination_id ──> combinations          plants.food / native / seeds : TEXT NULL

Dashboard
  /tips            list · new · edit · delete        (adminResource, like blogs)
  /combinations    list · new · edit · delete        (was list + delete)
  /plants/:id      tips section: [picked tip ▾ | new tip] rows, sortable; trait inputs with suggestions
```

## 3 — Shared (`packages/shared/src/plants.ts`)

- **Traits:** `plantFields`: `seeds/native/food: z.string().trim().max(60).nullable()` (empty string →
  null in the form script). `PlantSummary` has the same fields as `string | null`. Remove the
  `.default(false)`s and use `.default(null)`.
- `export const PLANT_TRAIT_SUGGESTIONS = { food: [...], seeds: [...], native: [...] } as const` (D6).
- **Tips:**
  - `tipCreate = { title, content }`, `tipUpdate` partial; `Tip = { id, title, content }`.
  - `TipSummary = Tip & { plantCount: number }`, for the dashboard list.
  - Remove `plantChildFilter` from tips (lifecycles and diseases keep it).
- **`plantSave.tips`** becomes a union per row: `{ tipId: entityId }` (pick existing) or
  `{ title, content }` (new). The order is the position. Max 50, and the same tip can't be picked twice
  (refine).
- **`combinationSave`** = `{ title, description: text.nullable(), plantIds: z.array(entityId).max(500) }`
  (unique refine).
- `tipSave = tipCreate`, for the Συμβουλές form.

## 4 — Backend

**Schema** (`backend/src/db/schema.ts`):
- `tips` without `plantId`/`position`. New `plantTips` table, with its index `(plant_id, position)` and
  `(tip_id)`.
- Relations: plant → `tipLinks` (`many(plantTips)`), link → `tip`, tip → `plantLinks`.
- `plants.food/native/seeds: text(...)`.

**Plants** (`plants.repo.ts`): `withDetails.tips` becomes
`tipLinks: { orderBy: position, with: { tip: true } }`. `toJson` maps to `Tip[]`, and `toSummary`
passes the text traits.

**Plant save** (`admin/plants/plants.save.ts`):
- **New tips:** insert them first (one statement per tip, collecting their ids; a batch can't hand
  ids to later statements, so this mirrors the plant create path).
- **Links:** then a batch with
  - the plant update
  - lifecycles and diseases through `syncChildren`
  - `replaceLinks(plantTipLinks, plantId, orderedTipIds)`
  - images
- **Orphans (D3):** after the batch, delete the tips that were unlinked here and now have no link left
  (`DELETE FROM tips WHERE id IN (removed) AND NOT EXISTS (SELECT 1 FROM plant_tips WHERE tip_id = tips.id)`).
- **Errors:** if the batch fails, delete the tips created in step 1 (no stray library entries).
- **Checks:** `assertExists` for every picked `tipId` (400 `UNKNOWN_REFERENCE` at `tips.<i>.tipId`).

**Tips resource:**
- `tips.repo.ts`: library list (newest first, paginated, with `plantCount` by subquery), get, create,
  update, and remove (link rows cascade).
- `tips.routes.ts`: `paginate: true`, no filter.
- `admin/tips/tips.admin.tsx`: `adminResource` with `edit` (title `TextField`, content `TextArea`; the
  edit page also lists «Χρησιμοποιείται σε: …» the plants using it, as links).

**Combinations:**
- `admin/combinations/combinations.save.ts`: one batch with
  - update or insert the combination
  - `UPDATE plants SET combination_id = NULL WHERE combination_id = :id AND id NOT IN (:plantIds)`
  - `UPDATE plants SET combination_id = :id WHERE id IN (:plantIds)`

  `assertExists` for every plant (one `inArray` query, count compare).
- `admin/combinations/combinations.admin.tsx` replaces the entry in `lists.tsx`, using `edit`. The form
  has title, description, and a **`PlantPicker`** (see UI).

**Dashboard home:** add `{ key: 'tips', label: 'Συμβουλές', table: tips, path: '/tips' }` to `TABLES`.

## 5 — Dashboard UI (`backend/src/resources/admin/ui/`)

- `fields.tsx` → **`SuggestField`**: a `TextField` plus `list="…"` pointing to a `<datalist>` of
  suggestions; nullable. The plant form's three `Toggle`s become `SuggestField`s inside the facts card,
  with the 🍅 🌰 📍 emojis in front (same layout as the other fact rows).
- **`SearchSelect`** (new, `ui/search-select.tsx`): a text input that filters a list of options rendered
  in the page (`<li data-value>`); Enter or click picks one. Used by:
  - **tip rows** in the plant form: each row is either *picked* (hidden `tipId` + read-only title/text +
    «Επεξεργασία ↗» to `/tips/:id`) or *new* (title + text inputs). «+ Συμβουλή» offers «Υπάρχουσα» /
    «Νέα»; picking an existing one fills the row. Rows stay sortable (`RepeatableList`).
  - **`PlantPicker`** in the combination form: search plus checkboxes (name, and the cover photo as a
    small thumbnail), showing «στο “X”» for plants that are in another combination.
- `admin.client.js`: new `data-type="tip"` row reading (`{ tipId }` or `{ title, content }`), the
  `SearchSelect` behaviour, and `PlantPicker` → `plantIds` (array of checked values). Server errors map
  to the right row as today (`tips.2.tipId`).

## 6 — App

- `config/plant-traits.ts`:
  - `useTrait(p)` → `p.food ? { emoji: '🍅', label: p.food } : null`
  - `propagationTrait(p)` → `p.seeds ? { emoji: p.seeds === 'Από φυτό' ? '🪴' : '🌰', label: p.seeds } : null`
    (keeps today's two emojis)
  - new `originTrait(p)` → `p.native ? { emoji: '📍', label: p.native } : null`
- `components/plants/plant-card.tsx`: traits row uses the three as above (missing → hidden). The footer
  pill uses `propagationTrait` only when it's set.
- `components/plants/plant-facts.tsx`: the pills for propagation and origin show the text, so
  «Ιθαγενές φυτό» becomes the stored text.
- The plant page tips section reads `plant.tips` (now `{ id, title, content }`); the markup is unchanged.

## Testing

- **Migrations:**
  - on a scratch copy with real rows, check the row counts of every plant child table, the tip order
    per plant, and the converted trait texts (D7) before and after 0008/0009
  - `PRAGMA foreign_key_check` is empty
- **Backend E2E** (fake Access, like plan 02):
  - a plant with 2 picked + 1 new tip in order, then reorder
  - unlink a tip used elsewhere (it stays) and one used nowhere (it's deleted)
  - pick an unknown `tipId` → 400; a failed save leaves no new tips
  - tips page create/edit/delete (it disappears from plants)
  - combination save moves plants between combinations and clears removed ones
  - trait text null/empty/long → 400 above 60
- **Browser (Playwright):**
  - plant form: pick a tip by typing, add a new one, sort, save, reopen
  - trait suggestions appear and free text works
  - combination picker search and checkboxes
  - no console or CSP errors
- **App:** typecheck and lint; on web, the results card and plant page show «🍅 Τρώγεται ο καρπός», «🌰 Από
  σπόρο», «📍 Ιθαγενές της Μεσογείου», and hide empty ones.

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Schema: `plantTips`, tips without plant_id/position, text traits | `backend/src/db/schema.ts` |
| 2 | Hand-written migrations 0008 (tips) + 0009 (traits), scratch test, local apply | `backend/drizzle/0008_*`, `0009_*` |
| 3 | Shared: traits as text + suggestions, tip library types, `plantSave.tips` union, `combinationSave` | `packages/shared/src/plants.ts` |
| 4 | Plants repo (tips through links, text traits) | `backend/src/resources/plants/plants.repo.ts` |
| 5 | Tips repo/routes as a library | `backend/src/resources/tips/*` |
| 6 | Plant save: new tips, links, orphan delete, rollback | `backend/src/resources/admin/plants/plants.save.ts` |
| 7 | Combination save | `backend/src/resources/admin/combinations/combinations.save.ts` |
| 8 | UI: `SuggestField`, `SearchSelect`, `PlantPicker` + client script | `admin/ui/*`, `admin/admin.client.js` |
| 9 | Plant form: trait inputs, tip rows | `admin/plants/plants.admin.tsx` |
| 10 | Tips + combinations admin pages, home card | `admin/tips/*`, `admin/combinations/*`, `admin/lists.tsx`, `admin/admin.repo.ts`, `admin/admin.app.tsx` |
| 11 | App: trait helpers, card, facts | `app/src/config/plant-traits.ts`, `app/src/components/plants/{plant-card,plant-facts}.tsx` |
| 12 | Tests (migration, E2E, browser, app) + docs line | scratchpad, `instructions/adding-a-resource.md` |
| 13 | **With approval:** remote migrations, commit/push, preview build | — |

Files **not** touched: users' notes (Σημειώσεις stays list + delete), lifecycles/diseases (still one
plant each), the explore filters (they don't filter yet), plan 03 files.

## Open items

- If the library grows past a few thousand tips or plants, the dropdowns should search on the server
  (`GET /api/admin/tips?q=`). Default: client-side for now.
- Should lifecycles and diseases also become reusable like tips? Default: no.
- The results page filters («Φαγώσιμο» etc.) could later filter by these texts. Not in this plan.
