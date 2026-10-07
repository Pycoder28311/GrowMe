# 06 — Leaf corner and the animated search bar

**Goal:**
- The top-left corner button shows a **leaf**.
- The top-right search button opens a **search bar** that animates exactly like the navbar search in
  the Portfolio project (`Personal/Portfolio`, `src/shared/zoom/ZoomNavbar.jsx` + `navbar/`):
  1. The bar grows from the icon leftwards to the leaf.
  2. The icon sweeps across it while turning 90°, revealing the placeholder letter by letter.
  3. Results pop in as you type.
- Results come in two labelled lists: **Φυτά** first, then **Άρθρα**.
- Tapping a result makes it **grow from its place into the full screen** before the plant or article
  page shows.

**Depends on:** nothing new (plants and blogs APIs exist). **Blocks:** nothing.

**The Portfolio project is only read, never changed.** Its timings and curves are copied into this
app as constants (§3), with a comment naming the source file.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Same direction as the Portfolio: the bar grows **leftwards** from the top-right icon until it reaches the leaf (keeping the corner gap). Then the icon sweeps left to the bar's left end, turning 90°. Closing is one movement: the bar shrinks back to the right and the icon rides its left edge home | User |
| D2 | **Both** zoom effects. (a) Result rows enter from 72% size with a 14 px rise and leave shrinking to 70% with a 16 px drop; rows that stay slide to their new place. (b) A tapped row grows from its place to full screen, then the page shows | User |
| D3 | Search runs **on the phone** over a small index loaded once: every plant (name, scientific name, cover) and blog (title, kind, cover). Typing filters instantly; accents and capitals don't matter | User |
| D4 | The leaf still takes you **home** when tapped (label «Αρχική»). It's only a new icon "for now" | Default |
| D5 | The bar keeps the **app's look** (white raised tile, green focus). The Portfolio's dark colours aren't copied, only its motion | Default |
| D6 | Results show **only while something is typed**, as in the Portfolio. Each list has a label with a count («Φυτά (3)», «Άρθρα (1)»), up to 8 items, and an empty line when a list has none («Κανένα φυτό»). With no matches at all: «Δεν βρέθηκε τίποτα» | Default |
| D7 | Row content. **Plant:** cover thumbnail (🪴 without one), name, scientific name. **Blog:** cover, title, kind label (Άρθρο / Γλωσσάρι / Wiki / Μπαλκόνι) | Default |
| D8 | Matches whose name **starts with** the typed text come first, then those that contain it, then alphabetical. Every typed word must match | Default |
| D9 | Closing: the search icon (now ✕ turned 90°), tapping the dimmed page, Android back, or picking a result | Default |
| D10 | The tapped-row growth follows the Portfolio's card flight. It **turns over** (rotateY 0→180°) while growing 70% of the way (560 ms), then settles to full screen (420 ms). Its back face is the app's surface colour, then the page fades in. Without the turn it would be a plain zoom: say if you prefer that | Default |
| D11 | Reduce Motion on (system setting) means no sweep and no flight. The bar opens and closes at once, rows appear without motion, and a tapped result opens with a 180 ms fade (the Portfolio's reduced timing) | Default |
| D12 | The index is cached for the session and reloaded on open when older than 5 minutes. The server marks it cacheable for 5 minutes | Default |

## 1 — Risks

1. **Feel on phones.**
   - The Portfolio animates CSS widths. Here it's Reanimated 4 (`react-native-reanimated` 4.5.1).
   - Width animations run on the UI thread, but they do relayout. If they stutter on Android, the
     bar is drawn at full width and revealed with a `scaleX` + mask instead.
   - Check on a real Android phone, not only on web.
2. **3D turn on Android.** `perspective` + `rotateY` works in RN transforms, but
   `backfaceVisibility` has quirks on Android. The back face is a separate layer shown after 90°,
   not left to `backfaceVisibility`.
3. **Index size.** At a few thousand items the index is a few hundred KB. Beyond that, the
   server-search option comes back (a `?q=` endpoint).
4. **The keyboard** opens when the input focuses (at the start of the sweep, as in the Portfolio).
   The results panel must sit above it (`KeyboardAvoidingView` / max height from the keyboard's
   height).

## 2 — How it works

```
AppShell
 ├─ leaf tile (top-left) ── IconButton icon="leaf" → home
 └─ <SearchBar> (top-right, replaces the search IconButton)
      phases: closed → expanding (1200 ms, width grows left) → travelling (520 ms, icon sweeps + 90°,
              placeholder letters appear) → open
              open → collapsing (1200 ms, width shrinks right, icon rides the left edge) → closed
      scrim over the page (fades in with the expansion; tap = close)
      results panel under the bar (only with a query): «Φυτά (n)» list, then «Άρθρα (n)» list
      tap a row → <ResultFlight> overlay: row copy grows to full screen → router.push → fade out
data: GET /api/search-index (once per session) → matchSearch(index, query) on every keystroke
```

## 3 — Motion constants (copied from the Portfolio)

New `app/src/config/search-motion.ts`. Every number comes from Portfolio
`src/shared/zoom/navbar/navbarGeometry.js`, `navbar/navbarSearch.css` or
`reelCard/reelCardMotion.js`, as named in a comment:

| Constant | Value | Portfolio source |
|---|---|---|
| `EXPAND_MS` / `EXPAND_EASING` | 1200 / bezier(0.22, 1, 0.28, 1) | `SEARCH_EXPAND_MS`, `SEARCH_EASING` |
| `TRAVEL_MS` / `GLYPH_EASING` | 520 / bezier(0.65, 0, 0.35, 1) | `SEARCH_TRAVEL_MS`, glyph transition |
| `ICON_LEAD_MS` | 400 (the sweep starts this long before the bar reaches the leaf) | `SEARCH_ICON_LEAD_MS`, `iconTravelStartMs` |
| `PLACEHOLDER_REVEAL_SPAN` | 26 (letter reveal window, px) | `placeholderRevealWindow` |
| `GLYPH_TURN` | 90° | `.is-icon-left` rotate |
| `RESULT_ENTER_MS` / easing / scale / rise | 320 / bezier(0.16, 1.18, 0.4, 1) / 0.72 / 14 | `RESULT_ENTER_*` |
| `RESULT_EXIT_MS` / easing / scale / drop | 260 / bezier(0.4, 0, 0.9, 0.5) / 0.7 / 16 | `RESULT_EXIT_*` |
| `RESULT_MOVE_MS` / easing | 440 / bezier(0.32, 0.9, 0.26, 1) | `RESULT_MOVE_*` |
| `FLIGHT_TURN_MS` / easing / growth | 560 / bezier(0.5, 0, 0.3, 1) / 0.7 | `FLIGHT_TURN_*`, `FLIGHT_TURN_GROWTH` |
| `FLIGHT_SETTLE_MS` / easing | 420 / bezier(0.22, 1, 0.36, 1) | `FLIGHT_SETTLE_*` |
| `FLIGHT_PERSPECTIVE` / reduced | 1600 / 180 ms | `FLIGHT_PERSPECTIVE`, `FLIGHT_REDUCED_MS` |

The pure timing helpers are ported to TypeScript in the same file and get unit checks:
- `easedTimeAtProgress`
- `iconTravelStartMs(distance)`: when the sweep starts relative to the bar's travel
- `placeholderRevealWindow(characterCenter, openWidth)`: each letter's delay and duration

## 4 — Backend

- **`GET /api/search-index`**, public, in the new `backend/src/resources/search/search.routes.ts`:
  - It returns
    `{ plants: [{ id, name, scientificName, image }], blogs: [{ id, name, kind, image }] }`, where
    `image` is the first cover URL or null.
  - Two queries: plants with their first `plant_images` row, blogs with their first `blog_images`
    row. It reuses `imageUrl()` from `images.repo.ts`.
  - It sends `Cache-Control: public, max-age=300`.
- **Shared** (`packages/shared/src/search.ts`): `SearchIndex`, `SearchPlant`, `SearchBlog` types.

## 5 — App

- **Icons** (`components/ui/icon.tsx`): `leaf` (SF `leaf`, Material `eco`).
- **`components/layout/app-shell.tsx`:**
  - The left tile becomes `icon="leaf"` (D4).
  - The right `IconButton` becomes `<SearchBar top={cornerTop} />`.
  - The bar's open width = screen width − 2 × `space.md` − `size.touch` (leaf) − `space.sm` (gap),
    so no measuring is needed, unlike the Portfolio's `measureSearchLane`.
- **`lib/search.ts`:**
  - `useSearchIndex()` loads on the first open (D12) and gives `loading` / `error` / `retry`.
  - `matchSearch(index, query)` splits the query into words, ignores accents and capitals
    (NFD-stripped lowercase, as in the dashboard pickers), applies D8, and caps each list at 8.
  - It's pure, with unit checks.
- **`components/search/search-bar.tsx`** (the bar):
  - **Phase state:** `closed | expanding | travelling | open | collapsing`, with timers like
    `ZoomNavbar.openSearch/closeSearch`.
  - **Shared values:** `width` (animated by `withTiming(EXPAND_MS, EXPAND_EASING)`), `glyphX` and
    `glyphTurn` (`TRAVEL_MS`, `GLYPH_EASING`; while collapsing they share the width's timing so the
    icon rides the edge, as the Portfolio's CSS does), and the scrim opacity.
  - **Placeholder** «Αναζήτηση φυτών και άρθρων»: one `Animated.Text` per letter, each fading and
    dropping 7 px into place at the delay from `placeholderRevealWindow`. It's hidden once text is
    typed.
  - **Input:** focuses as the sweep starts. Submit opens the first result. The icon becomes ✕ while
    open, matching the Portfolio's single toggle glyph.
  - **Accessibility:** `accessibilityRole="search"`, labels «Άνοιγμα αναζήτησης» / «Κλείσιμο
    αναζήτησης», a live region saying how many results.
  - **Closing:** Android back (`BackHandler`) and taps on the scrim close it (D9).
- **`components/search/search-results.tsx`** (the panel):
  - A white card attached under the bar, at most the space above the keyboard, scrolling.
  - Section labels «Φυτά (n)» and «Άρθρα (n)», then the rows (D6, D7).
  - Rows use Reanimated layout animations: a custom `Keyframe` entering (scale 0.72→1, translateY
    −14→0) and exiting (scale 1→0.7, translateY 0→16) with §3's timings and easings, plus
    `LinearTransition` (`RESULT_MOVE_MS`) for rows that move.
  - It's a plain `View` list, not a `FlatList`: at most 16 rows, and exit animations need the rows
    to stay mounted.
- **`components/search/result-flight.tsx`** (the tapped-row growth, D10):
  - On tap, the row is measured (`measureInWindow`) and a copy is drawn at that rectangle in an
    overlay over everything.
  - The search closes **without** its collapse animation, since the overlay covers it.
  - The copy turns and grows to `flightTurnRect` (70% of the way to full screen, ported), then
    settles to full screen. After 90° the back face (surface colour) shows instead of the row.
  - At the end, `router.push` to `/plants/[id]` or `/wiki/[id]`, then the overlay fades out
    (150 ms) once the page has mounted.
  - With Reduce Motion (D11): a 180 ms fade only.
- **`components/search/result-row.tsx`:** one row for plant and blog, so the flight copy looks the
  same.

## Testing

- **Unit (scratch Node script):** `matchSearch` (Greek accents, capitals, several words, the
  ordering, caps of 8), `iconTravelStartMs`, `placeholderRevealWindow`, `flightTurnRect`. The
  ported helpers must give the same numbers as the Portfolio's tests for the same inputs (read
  only).
- **Backend:** `/api/search-index` returns every plant and blog with covers, needs no sign-in, and
  sends the cache header.
- **Web (Playwright, phone size):**
  - Screenshots at fixed times (0, 300, 600, 1200, 1500, 1750 ms) show the bar growing left, then
    the icon sweeping and the letters appearing.
  - Typing shows both labelled lists. Rows animate in (scale mid-way) and the right rows leave.
  - Tapping a plant ends on its page; tapping a blog ends on the article.
  - Closing by icon, scrim and Escape works.
  - No page errors, no horizontal scroll.
- **Phone (manual, before release):** smoothness on Android, the keyboard with the panel, back to
  close, and the turn's back face.
- **Typecheck and lint.**

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Search index endpoint + shared types | `backend/src/resources/search/search.routes.ts`, `backend/src/index.ts`, `packages/shared/src/search.ts`, `index.ts` |
| 2 | Motion constants + ported timing helpers (+ unit checks) | `app/src/config/search-motion.ts` |
| 3 | Index hook + `matchSearch` (+ unit checks) | `app/src/lib/search.ts`, `app/src/api/search.ts` |
| 4 | Leaf icon; shell uses `SearchBar` | `components/ui/icon.tsx`, `components/layout/app-shell.tsx` |
| 5 | The bar: phases, width, sweep, placeholder letters, scrim, close paths | `components/search/search-bar.tsx` |
| 6 | Results panel with labelled lists and row enter/exit/move | `components/search/search-results.tsx`, `result-row.tsx` |
| 7 | Tapped-row flight into the page | `components/search/result-flight.tsx` |
| 8 | Reduce Motion paths | the three components |
| 9 | Tests (unit, backend, web) + a docs line | scratchpad, `instructions/` |
| 10 | **With approval:** deploy, commit/push, new app build | — |

**Files not touched:** the whole `Personal/Portfolio` project (read only; values copied with their
source named), the database (no migration), the bottom nav, and the explore filters.

## Open items

- D10: keep the Portfolio's turn-over, or use a plain zoom (row scales straight to full screen)?
- Should the leaf later open something of its own (e.g. "about GrowMe")? For now it goes home (D4).
