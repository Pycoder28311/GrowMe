# 08 — Plant form widgets (dashboard)

**Goal:** the dashboard plant form replaces plan 07's stand-in inputs with the real widgets from `docs/ideas/fieldPlantChanges.md`:
- **Month ranges:** a list of up to 3. «+ Προσθήκη εποχής» adds one, ✕ removes one, and drag or ↑/↓ reorders them. The order is saved only on Save.
- **Sun bar:** a 00:00–24:00 bar. The admin drags either edge or the whole span.
- **Duration box:** a number and a unit that can turn into a «από–έως» range. Used for the lifespan and for every stage.
- **Stages:** «+ Στάδιο σπόρου» and «+ Στάδιο φυτού». Seed stages are coloured and always above plant stages, and a small switch changes a stage's type.

The API and database stay exactly as plan 07 left them. This plan only changes how the form collects the same JSON.

**Depends on:** plan 07, implemented. Its `@growme/shared` helpers are used here: `parseDuration`, `formatDuration`, `DURATION_UNITS`, `DURATION_UNIT_LABELS`, `sunLength`, `sunPart`, `SUN_PART_LABELS`, `MAX_MONTH_RANGES`.
**Blocks:** nothing. Plan 09 (app plant page and filters) is independent of this one.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | A stage's type can change later. A small «→ Στάδιο φυτού» / «→ Στάδιο σπόρου» button on each stage moves it to the edge of the other group (a seed stage becomes the first plant stage; a plant stage becomes the last seed stage) and recolours it | User |
| D2 | Dragging and ↑/↓ move a stage **only within its group**. Seed stages always stay above plant stages: drag stops at the group edge, and ↑/↓ are disabled there. The server's "seed stages first" check (plan 07) stays as a safety net | User |
| D3 | The sun bar snaps to **whole hours** (the `sun_start`/`sun_end` integer columns from plan 07; no migration). The minimum span is 1 hour | User |
| D4 | A new stage's duration starts on **months**; the lifespan starts on **years** (ideas file). The admin can pick any unit | User |
| D5 | **Order:** month ranges and stages move only in the page. The new order goes to the server on Save, like every other list in the form (the ideas file asks for this) | User (ideas file) |
| D6 | The month ranges become a `RepeatableList` with three new generic options: <br>• `max` (hides the add button at the limit) <br>• `shape="tuple"` (each row is sent as `[field 0, field 1]`) <br>• `skipEmpty` (rows with nothing set are left out) <br>The rows' selects are named `0` and `1`, so a server error at `monthRanges.1.0` lands on the right select through the existing `findByPath`. Plan 07's `data-month-ranges` collector is removed | Default |
| D7 | **Stage groups** are a generic `RepeatableList` feature: `groups={['seed', 'plant']}`, each variant names its group, and `groupOf(item)` places existing rows. `admin.client.js` handles inserting at the end of a group, keeping drag and ↑/↓ inside it, and the switch button. A future list (e.g. "indoor/outdoor" care steps) can reuse it | Default |
| D8 | The sun bar and duration box are TypeScript in a **second bundle**, `admin-editor/widgets.ts`, served as `/admin-widgets.js` and loaded only by forms that use them. It imports the duration and sun helpers from `@growme/shared` instead of copying them into plain JS. `admin.client.js` stays the generic form and list engine | Default |
| D9 | The widgets write their value into a **hidden input** with `data-field` (`sunStart`/`sunEnd`: number; `lifespan`/`duration`: text, nullable) and dispatch `input`. `collect()`, the dirty flag, the beforeunload warning and the error display then work unchanged | Default |
| D10 | Sun bar, when empty: «Δεν ορίστηκε» and a «Όρισε ώρες ήλιου» button that places 10:00–16:00. A ✕ «Καθαρισμός» empties it again (both null) | Default |
| D11 | The sun bar's label is live: «10:00 – 16:00 · 6 ώρες · Μεσημεριανός ήλιος», using `sunLength`, `sunPart` and `SUN_PART_LABELS`, so the admin sees the same "part of the day" the app will show | Default |
| D12 | **Duration box:** <br>• «Εύρος» (`aria-pressed`) switches to range mode and focuses the "to" number <br>• Backspace in an empty "to" box (it deletes the dash) returns to one number <br>• typing `-` in the "from" box also switches to range <br>• an empty "from" sends null <br>• unit labels are Greek (`DURATION_UNIT_LABELS[u].many`), and the stored value stays `4-6 weeks` | Default (ideas file) |
| D13 | **Seed stage colours:** a warm sand background (`--seed-soft`) with a «🌰 Σπόρος» badge. Plant stages keep white with «🪴 Φυτό». A thin labelled gap separates the two groups | Default |

## 1 — Risks and blockers

1. **Plan 07 must be implemented and applied locally first** (migration 0013). Nothing here touches the database.
2. **Drag:** the existing drag code uses HTML5 `draggable`, which is mouse-only. The sun bar uses **pointer events** instead, so it works with touch too. For stages and month ranges, touch keeps using ↑/↓, as today.
3. **CSP:** `script-src 'self'` and no inline styles. The sun bar positions its span with **CSS custom properties set from script** (`el.style.setProperty('--from', …)`). That is allowed under `style-src-attr 'unsafe-inline'`, already used by the dashboard; check it in the CSP header in `admin.app.tsx`.
4. **The bundle size grows.** `widgets.ts` imports only `plant-fields.ts` (no zod), so expect ~5 KB. Import from `@growme/shared/src/plant-fields` directly if the barrel would pull in zod.

## 2 — Architecture

```
plants.admin.tsx (server JSX)
 ├─ RepeatableList  monthRanges   max=3, shape=tuple, skipEmpty, sortable   ─┐
 ├─ RepeatableList  lifecycles    groups=[seed, plant], 2 variants, sortable │ admin.client.js
 │     └─ StageFields: badge + switch, hidden seed, DurationField, title…    ─┘ (lists: add/remove/move/drag/collect)
 ├─ SunWindow       hidden sunStart / sunEnd                               ─┐
 └─ DurationField   hidden lifespan (and duration in each stage)           ─┘ /admin-widgets.js (widgets.ts)
                                                                              writes the hidden inputs, fires `input`
```

Everything is event delegation on the form, so rows added later from a `<template>` work with no setup. `admin:row-added` is only needed if a widget must draw something when it appears.

## 3 — Generic list features (`ui/repeatable-list.tsx`, `admin.client.js`)

**`RepeatableList` props:**

| Prop | Renders | Client |
|---|---|---|
| `max?: number` | `data-max` on the `ol` | after add/remove: hide the add buttons when the list is full, and show a muted «Έως N» |
| `shape?: 'tuple'` | `data-shape="tuple"` | `collect`: each row → `[row['0'], row['1'], …]` (keys in order) |
| `skipEmpty?: boolean` | `data-skip-empty` | `collect`: leave out rows whose values are all null |
| `groups?: string[]` | `data-groups="seed plant"` | insert, move and drag rules below |
| `groupOf?: (item) => string` | `data-group` on existing rows | — |
| `variants[].group` | `data-group` on the template's row | — |

**`admin.client.js`:**
- `addRow(wrap, variant)`: when the row has `data-group`, insert it **after the last row of its group**. With none, insert before the first row of a later group in `data-groups` order, otherwise append. Then `refresh(list)`.
- `refresh(list)`:
  - ↑ is disabled when the previous row is in another group, and ↓ when the next one is
  - set `data-first-of-group` on the first row of each group, for the CSS gap and label
  - enforce `data-max`
- Drag (`dragover`/`drop`): ignore a target row in another group, so no drop marker is shown.
- **New `data-switch-group` button:**
  - moves the row to the boundary (D1)
  - flips its `data-group`
  - updates its hidden `seed` input (`value="true"/"false"`, `data-type="json"`) and badge text
  - `refresh`, focus the switch button, `dirty = true`
  - The button carries `data-to="plant"` or `data-to="seed"`, so `admin.client.js` stays free of plant words: the server renders the labels and `admin.client.js` swaps between `data-label-seed` and `data-label-plant`.
- **Remove:** the plan 07 `data-month-ranges` branch in `collect`, `KEYED` and `keyOf`, plus `monthRangesOf`. Keep the Greek message for a half-set month («Διάλεξε και τους δύο μήνες»).

## 4 — Month ranges (`plants.admin.tsx`)

```tsx
<RepeatableList
  field="monthRanges" title="📅 Εποχές" itemLabel="Εποχή" items={(p?.monthRanges ?? []).map(toRow)}
  sortable max={MAX_MONTH_RANGES} shape="tuple" skipEmpty rowIds={false}
  emptyText="Καμία εποχή ακόμα." renderItem={(r) => <MonthPair from={r?.from} to={r?.to} />}
/>
```

- **`MonthPair`** (new, `ui/fields.tsx`): two `Select`s with `field="0"` / `field="1"` over `MONTHS`, with «—» as the empty choice. It reuses `Select`, so each half gets its own error slot.
- **`items`:** `RepeatableList` wants `{ id }` items, so map each range to `{ id: i, from, to }` (with `rowIds={false}`, the id isn't sent).
- **Placement:** it moves out of the facts card into its own section right after it. A list with add buttons doesn't fit in a fact row.
- **The button** reads «+ Εποχή» and hides at 3. The ideas file wants it below the ranges, so add `addAt?: 'head' | 'foot'` to `RepeatableList` (default `'head'`) and use `'foot'` here.
- **Remove:** `MonthRanges` from `ui/fields.tsx` (plan 07), and its `.row > select` CSS if nothing else uses it.

## 5 — Sun bar (`ui/sun-window.tsx` + `admin-editor/sun-window.ts`)

**Server (`SunWindow`):**

```tsx
<div class="field sun-window" data-sun-window data-empty={start == null ? '' : undefined}>
  <span class="caption">Ώρες ήλιου</span>
  <input type="hidden" data-field="sunStart" data-type="number" value={start ?? ''} />
  <input type="hidden" data-field="sunEnd" data-type="number" value={end ?? ''} />
  <div class="sun-track" data-track>                {/* 24 hour ticks; labels 00, 03 … 24 */}
    <div class="sun-span" data-span tabindex="0" aria-label="Μετακίνηση όλου του διαστήματος" />
    <div class="sun-handle" data-edge="start" role="slider" tabindex="0" aria-label="Από" aria-valuemin="0" aria-valuemax="23" />
    <div class="sun-handle" data-edge="end"   role="slider" tabindex="0" aria-label="Έως" aria-valuemin="1" aria-valuemax="24" />
  </div>
  <p class="small" data-sun-label aria-live="polite" />
  <div class="row"><button type="button" data-sun-set>Όρισε ώρες ήλιου</button><button type="button" data-sun-clear>✕ Καθαρισμός</button></div>
  <p class="error" aria-live="polite" />
</div>
```

**Client (`sun-window.ts`):**
- State `{ start, end } | null`, read from the hidden inputs.
- `render()`:
  - sets `--from` / `--to` (percent of 24) on the track
  - sets `aria-valuenow` and `aria-valuetext` («10:00») on the handles
  - writes the label (D11)
  - toggles `data-empty` and the set/clear buttons
- **Pointer** (`pointerdown` on a handle or the span, `setPointerCapture`; `pointermove`):
  - hour = round(x / width × 24)
  - an edge is clamped so `end - start ≥ 1`
  - the span moves both edges by the same delta, clamped to 0–24 so the length is kept
- **Keyboard:**
  - handles: ←/→ ±1, PageDown/PageUp ±3, Home/End
  - the span: ←/→ moves the whole window
- **Every change:** write both hidden inputs, then `dispatchEvent(new Event('input', { bubbles: true }))`.
- Server errors (`sunEnd`) land in the field's `.error` slot.

**CSS (`styles.ts`):**
- the track: 8px high, rounded, `--outline` background, with a light night gradient at the ends
- the span: `left: var(--from); right: calc(100% - var(--to))` in `--primary`
- the handles: 28px circles with a `:focus-visible` outline
- `[data-empty] .sun-span, [data-empty] .sun-handle { display: none }`

## 6 — Duration box (`ui/fields.tsx` `DurationField` + `admin-editor/duration.ts`)

**Server:**

```tsx
<DurationField field="lifespan" label="Διάρκεια ζωής" value={p?.lifespan} unit="years" />
```

- Renders:
  - a hidden `data-field` text input (`data-nullable`)
  - a small «Εύρος» button (`aria-pressed`)
  - a `.duration-box`: number «από», a «–» span and a number «έως» (both hidden in single mode), and a unit `select`
  - the usual error slot
- The starting state comes from `parseDuration(value)`. An unparsable old value shows as empty, with the raw value in a hint.

**Client:**
- On `input`/`change` inside a `.duration-box`:
  - compose `formatDuration({ from, to, unit })`, or `''` when "from" is empty
  - write the hidden input and dispatch `input`
  - an invalid range (`to ≤ from`) is still sent, so the server's Greek message shows under the box
- `-` typed in "from" → `preventDefault`, switch to range, focus "to".
- Backspace in an empty "to" → back to single mode, focus "from" with the caret at the end.
- «Εύρος» toggles the mode. Leaving range mode drops "to".
- CSS: the two numbers and the dash sit in one bordered box (`.duration-box`), so it reads as one input. Its width grows in range mode (`[data-range]`).

## 7 — Stages (`plants.admin.tsx`)

```tsx
<RepeatableList
  field="lifecycles" title="🌱 Κύκλος ζωής" itemLabel="Στάδιο" items={p?.lifecycles ?? []}
  sortable soft groups={['seed', 'plant']} groupOf={(l) => (l.seed ? 'seed' : 'plant')}
  variants={[
    { key: 'seed', group: 'seed', label: 'Στάδιο σπόρου', render: () => <StageFields seed /> },
    { key: 'plant', group: 'plant', label: 'Στάδιο φυτού', render: () => <StageFields seed={false} /> },
  ]}
  renderItem={(l) => <StageFields stage={l} seed={l?.seed ?? false} />}
  emptyText="Πρόσθεσε στάδια: πρώτα του σπόρου (αν ξεκινά από σπόρο), μετά του φυτού."
/>
```

- **`StageFields`** (replaces plan 07's version):
  - a badge («🌰 Σπόρος» or «🪴 Φυτό»)
  - the switch button (D1)
  - hidden `seed` (`data-type="json"`)
  - `DurationField field="duration" label="Από τη σπορά" unit="months"`
  - `TitledText`
  - remove plan 07's `Toggle` and its `.field` error wrapper
- **The "seed stages first" error** (`lifecycles.<i>.seed`) now lands on the hidden `seed` input. Wrap the badge and the hidden input in a `.field` with an error slot, so it still shows if the safety net ever fires.
- **CSS:**
  - `.list-row[data-group="seed"]` gets the `--seed-soft` background
  - `[data-first-of-group]` (not the first row) gets a top margin and a `::before` label: «Στάδια φυτού». The label text comes from a `data-group-label` attribute through `content: attr(data-group-label)`, so there's no inline text in CSS.

## 8 — Bundle and loading

- **`admin-editor/build.mjs`:** build two entries, `editor.ts` → `editor.client.js` and `widgets.ts` → `widgets.client.js`, each written only when changed (keep the existing guard, since wrangler watches `src/`).
- **`.gitignore`:** add `src/resources/admin/widgets.client.js` next to `editor.client.js`.
- **`ui/layout.tsx`:** `ASSETS.widgets` (`/admin-widgets.js`). `admin.app.tsx` already serves every `ASSETS` entry.
- **`ui/widgets-script.tsx`:** `<WidgetsScript />` renders the `<script defer>` tag. `SunWindow` and `DurationField` render it, so any form that uses them loads it. Duplicates are harmless; the script checks a `window.__adminWidgets` flag.
- **`widgets.ts`:** one delegated listener set on `document`: `pointerdown`, `keydown`, `input`, `click`, and an initial `render()` for every `[data-sun-window]` on load.

## Testing

Same local setup as plan 07:
- a fake Access server on port 8790
- `wrangler dev --local-upstream admin.testingggg.lol --var ACCESS_TEAM_DOMAIN:… --var ACCESS_AUD:…`
- Playwright with the Access header added only to `localhost` requests
- results read from the local D1 file with `node:sqlite`

Two setup notes:
- Stop servers in a **separate** command; `pkill -f "wrangler dev"` matches its own shell.
- Use `page.waitForResponse` on the PUT, not `waitForURL`, since the form reloads the same URL.

| Area | Checks |
|---|---|
| Month ranges | <br>• add up to 3 (the button hides at 3 and comes back after ✕) <br>• drag the 3rd above the 1st, reload **without** saving: the old order comes back <br>• drag again, save: the database has the new order in `month_start/_2/_3` <br>• an empty row is skipped <br>• a half-set row → «Διάλεξε και τους δύο μήνες» under that select |
| Sun bar | <br>• empty → «Όρισε» → 10–16 <br>• drag the start handle to 08 and the end to 18 <br>• drag the body by +2 (10–20) <br>• it clamps at 24 <br>• keyboard ←/→ and PageUp <br>• the label reads «Απογευματινός» where expected <br>• ✕ clears to null <br>• save, then the database has the values |
| Duration box | <br>• single «2 years» <br>• «Εύρος» → 4-6 weeks <br>• Backspace in empty "to" → single again <br>• `-` in "from" → range <br>• empty → null <br>• `6-4` → Greek error under the box <br>• a stage starts on «μήνες» and the lifespan on «χρόνια» |
| Stages | <br>• «+ Στάδιο σπόρου» inserts after the last seed stage, above the first plant stage <br>• «+ Στάδιο φυτού» appends <br>• drag and ↑/↓ never cross the boundary (↑ is disabled on the first plant stage) <br>• the switch moves a stage to the right edge and recolours it <br>• save: `seed` and `position` are right in the database |
| General | <br>• no console errors and no CSP violations (listen for `securitypolicyviolation`) <br>• the beforeunload warning appears after a widget change <br>• `npm run build:admin` writes both bundles <br>• `tsc --noEmit` in `backend` |
| Touch | A Playwright mobile viewport (`hasTouch`): drag the sun bar with touch events |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `RepeatableList`: `max`, `shape`, `skipEmpty`, `groups`/`groupOf`/variant `group`, `addAt` | `ui/repeatable-list.tsx` |
| 2 | Client list engine: tuple/skip-empty collect, group insert/move/drag, switch button, max; remove `data-month-ranges` | `admin.client.js` |
| 3 | `MonthPair`; month-ranges section; remove `MonthRanges` | `ui/fields.tsx`, `plants/plants.admin.tsx`, `ui/styles.ts` |
| 4 | Second bundle: build entries, ASSETS, `WidgetsScript`, gitignore | `admin-editor/build.mjs`, `admin-editor/widgets.ts`, `ui/layout.tsx`, `ui/widgets-script.tsx`, `.gitignore` |
| 5 | Sun bar: server markup + client + CSS | `ui/sun-window.tsx`, `admin-editor/sun-window.ts`, `ui/styles.ts` |
| 6 | Duration box: server markup + client + CSS | `ui/fields.tsx`, `admin-editor/duration.ts`, `ui/styles.ts` |
| 7 | Stages: two variants, `StageFields` with badge, switch and duration; group CSS | `plants/plants.admin.tsx`, `ui/styles.ts` |
| 8 | Lifespan uses `DurationField`; sun uses `SunWindow` (replacing the `RangeField`) | `plants/plants.admin.tsx` |
| 9 | Browser tests (table above) | scratchpad |
| 10 | Docs: the new `RepeatableList` options and the two widgets in the admin section | `instructions/adding-a-resource.md` |
| 11 | **With approval:** commit; deploy together with the plan 07 remote migrations (see plan 07, task 14) | — |

**Files not touched:**
- `packages/shared`: the API and validation stay as plan 07 left them
- `backend/src/db`, `backend/drizzle`
- the app (`app/`), which is plan 09
- `Experiments/plant demo`, `Personal/Portfolio`, the TakeTheTrip codebase

## Open items

- The month-range button sits **below** the ranges (`addAt="foot"`), while the other lists keep theirs in the header. Say if you want all lists the same.
- The seed colour (`--seed-soft`, warm sand) is a proposal: say if you'd prefer another colour.
