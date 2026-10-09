# 12 — Back button, page transitions, search redesign, 5th tab, home fixes, grey dashboard

**Goal:**
- **Back:** on an open blog, post or plant, the top-right search button turns into an **X** that goes back.
- **Transitions:** posts and blogs slide up from the bottom to fill the screen, and slide back down when closed.
- **Search (home and every list page):**
  - the bar opens to the **full screen width**, in front of the leaf
  - an **X** at its right end closes it
  - a darker overlay covers the rest of the screen
  - the results are separate small cards, under light-gray centred list headers
  - the results are as tall as they need to be
- **Bottom bar:** a 5th button in the middle opens the plant results. The home page loses «Μάθε περισσότερα».
- **Home page:**
  - the «GrowMe» letters pop in one after the other and stay in their place (today they end up too low)
  - «Επίλεξε φυτό» gets a very soft light-orange inner shadow at its top
- **Admin dashboard:** a more serious grey theme with small corners, buttons whose background appears on hover, bigger object tiles with a «+ Δημιουργία» button on the ones that can be created.

**Depends on:** plans 06 (search bar), 09–11 (plant page, flight).
**Not in this plan:** the Portfolio reel's search effect (the icon flying into a result and zooming through its lens). It stays for later, when it can be checked on the PC. The current result "flight" stays.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **The X button:** on a blog (`/wiki/[id]`), a post (`/community/[id]`), a plant (`/plants/[id]`) and a plant's life cycle page, the top-right search button **morphs into an X** (the magnifier turns and fades into the X, ~250 ms). A tap goes **back** (`router.back()`, or home when there is no history, e.g. after a reload). On every other page it is the search, as today | User |
| D2 | **Posts and blogs open sliding up from the bottom** (`slide_from_bottom`), filling the screen; **back slides them down** (the stack's own reverse). Plants keep plan 10's rule: slide up from a card, grow from a search result | User |
| D3 | **Search bar width:** open, it spans the **whole width between the screen's side margins**, **in front of** the leaf (the leaf hides under it). The magnifier still sweeps to the left end as today | User |
| D4 | **X in the search:** at the bar's right end, **where the magnifier started**, an X button closes the search (same as Escape / back) | User |
| D5 | **Overlay:** the rest of the screen gets a **black overlay at low opacity** (≈ 35%) instead of today's light green-ink one. A tap on it closes the search | User |
| D6 | **No white panel** behind the bar and the results: each result is its **own card**, with a gap between them, on the overlay | User |
| D7 | **Corners:** the result cards and the list headers use a **smaller radius than the bottom buttons** (`radius.sm` = 12 → **8**, a new `radius.xs`) | User |
| D8 | **List headers** («Φυτά (3)», «Άρθρα (1)»): each a **separate light-gray element** (`#eceef0`), the short text **centred** and muted, radius 8. **The gap above a header is bigger than the gap below it**: the «Άρθρα» header sits `space.lg` under the last plant and `space.xs` above the first article | User |
| D9 | **Results height:** the list is **as tall as its results**. It scrolls only when it would pass the keyboard / the bottom of the screen | User |
| D10 | **5th bottom button, in the middle:** «Αποτελέσματα», icon `flower` (potted plant). It opens **/results with the last chosen filters**. With no filters chosen yet it **opens the «Επίλεξε φυτό» filter sheet**; applying it goes to the results. It is the active tab on `/results` | User |
| D11 | **Home:** the «Μάθε περισσότερα» link at the bottom of the first screen is **removed** | User |
| D12 | **The «GrowMe» letters:** each letter **pops in, one after the other, in one row, and stays where it lands**. Today they end lower than their place (see section 5 for the cause and fix) | User |
| D13 | **«Επίλεξε φυτό»:** a **very subtle light-orange inner shadow along its top edge** (inset, ≈ `#ffd2a6` at 60%, 3 px blur), on top of its current shine | User |
| D14 | **Dashboard theme:** greys instead of greens and the orange wash: background `#f4f5f7`, cards white with a 1 px `#e2e4e8` border and almost no shadow, text `#1f2328`, muted `#656d76`, **corners 6 px** (cards) and 4 px (inputs, buttons). The plant photo thumbnails keep their colours | User |
| D15 | **Dashboard buttons:** the **main actions stay filled**: «Αποθήκευση» and «+ Δημιουργία» solid dark grey (`#24292f`, white text), «Διαγραφή» solid red. **Every other button and link-button is text only**, and a light-grey background (`#eaeef2`) **appears on hover** (and keyboard focus) | User |
| D16 | **Dashboard home tiles** (Φυτά, Άρθρα, Συμβουλές, Συνδυασμοί, Χρήστες …): **bigger** (min 220 px wide, 120 px tall, the count in big type). Tiles of types that can be created (plants, blogs, tips, combinations) get a **«+ Δημιουργία» button** on them that goes **straight to the empty form** (`/{type}/new`); the rest of the tile still opens the list | User |
| D17 | **The dashboard's own colours live in its CSS tokens** (`ui/styles.ts`); the app's theme is not touched | Default |
| D18 | **Search on detail pages:** while the X is shown there is no search on that page. It comes back on the next list or home page | Default |

## 1 — Risks and blockers

1. **Web has no stack transitions:** expo-router on web shows pages without the slide (as in plan 10). The slide up/down is checked on a phone.
2. **«Back» after a reload** (web) or a deep link has no history: the X goes home instead (`router.canGoBack()`).
3. **The leaf under the open bar:** the bar must sit above the leaf and the page header slot (section bar) in z-order, and the leaf must not be tappable through it.
4. **Results height on web:** today the list is squeezed because the `ScrollView` inside a `maxHeight` box collapses on react-native-web. The fix in section 3 must be checked on web and on a phone.
5. **5th tab and «last filters»:** the filters live in `ExploreFiltersProvider` (memory only), so after the app restarts there are none and the tab opens the sheet. Say if they should be remembered across restarts (Open items).
6. **The letters' cause** is checked first on web and a phone (section 5); the fix depends on which of the two causes it is.

## 2 — The X button and the transitions

- **`components/search/search-bar.tsx` (`TopCorners`):**
  - `usePathname()` → `detail = /^\/(wiki|community|plants)\/[^/]+/.test(pathname)`
  - a shared value `toX` (0 → 1, 250 ms) drives the glyph: the magnifier rotates 90° and fades, an X (`close` icon) rotates in from −90°
  - `accessibilityLabel`: «Πίσω» while it is an X
  - press: `detail ? (router.canGoBack() ? router.back() : router.navigate('/')) : open()`
  - while `detail`, `open()` is never called and the search state stays closed
- **`app/(app)/community/[id].tsx`, `app/(app)/wiki/[id].tsx`:** `<Stack.Screen options={{ animation: 'slide_from_bottom' }} />` (as the plant page does). Back reverses it.
- **`components/home` / lists:** nothing changes in how posts and blogs are pushed.

## 3 — The search redesign

- **Bar (`search-bar.tsx`):**
  - `openWidth = screenWidth − 2·space.md` (it used to stop at the leaf); the bar keeps growing from the right
  - z-order: scrim < leaf < results < bar, so the open bar covers the leaf
  - **X button** (`IconButton`-sized, inside the bar at its right end, where the magnifier was): fades in when the magnifier has left (`glyph > 0.6`), tap → `close()`. The magnifier itself is no longer a close button
  - `scrim`: `alpha('#000000', 0.35)`
- **Results (`search-results.tsx`):**
  - no `card` panel: a plain column, `gap: space.sm` between cards
  - each `Row` is its own card: white, `radius.xs` (8), `shadow.tile`, padding `space.sm`
  - each group's header is a `View`: background `#eceef0`, `radius.xs`, `paddingVertical: space.xs`, the text small, muted, `textAlign: 'center'`
  - the «Άρθρα» group has `marginTop: space.lg`; inside a group the header → first row gap is `space.xs`
  - «Κανένα …» stays under its header in the same small centred style
- **Height:** the `ScrollView` gets `style={{ flexGrow: 0 }}` and the outer box only `maxHeight` (screen bottom or keyboard − `space.md`). So it is as tall as its content and scrolls only past that.
- **`theme/spacing.ts`:** `radius.xs = 8`.

## 4 — The 5th tab and the home page

- **`config/app.ts`:** `NavId` gets `'results'`; `NAV_ITEMS` becomes home, messages, **results** (middle, icon `flower`, tap animation `hop`), wiki, profile.
- **`app/(app)/_layout.tsx`:**
  - `TAB_ROUTES.results = '/results'`
  - `navIdFor`: `/results` → `results`
  - `onNavigate('results')`: when no filters are set, open the explore sheet instead of navigating
- **The explore sheet everywhere:** the sheet moves from the home page to a small provider (`lib/explore-sheet.tsx`, `openExplore()`), so the tab can open it from any page. The home page's «Επίλεξε φυτό» calls the same `openExplore()`.
- **`components/layout/bottom-nav.tsx`:** five tabs. Check the tabs still fit a 360 px wide phone (≥ 48 px each) and that the sliding tile measures them all.
- **`app/(app)/index.tsx`:** remove the «Μάθε περισσότερα» `PressableScale` and its styles.

## 5 — The letters and the explore button (home)

- **Why the letters end too low:** each letter of `PopInText` is an `Animated.View` with the `popIn` Keyframe (from `translateY: 8`, `scale: 0.7` to 0 / 1, with an overshooting bezier). The likely causes, checked in this order:
  1. On web, Reanimated runs a Keyframe as a CSS animation and the final keyframe is not kept after it ends, so the letters fall back to the first frame's `translateY: 8`
  2. On a phone, the overshoot easing (`1.56`) is applied to `translateY` as well, and a letter interrupted by a re-render (the title remounts when the page's height is measured) stays at an in-between value
- **Fix:** the letters no longer use a layout `entering` Keyframe. Each letter gets its own `useSharedValue` progress, started with `withDelay(i·40, withSpring(1))` on mount:
  - opacity from progress
  - `scale` 0.7 → 1 (the pop)
  - `translateY` 6 → 0, without overshoot (`Math.min(…)`), so it can never end below its place
  - it starts once (`useRef` flag), so a re-render doesn't replay or freeze it
  - with Reduce Motion the title is shown at once
  - `GlassText` (the tagline) uses the same `popIn` and gets the same treatment
- **«Επίλεξε φυτό» (`components/ui/action-button.tsx`):** a new optional prop `innerGlow`: an extra layer inside the button with `boxShadow: 'inset 0 3px 3px -1px rgba(255, 210, 166, 0.6)'`. Only the home button sets it.

## 6 — The admin dashboard

- **`backend/src/resources/admin/ui/styles.ts`:**
  - new tokens: `--bg #f4f5f7`, `--surface #fff`, `--border #e2e4e8`, `--ink #1f2328`, `--ink-muted #656d76`, `--primary #24292f` (actions), `--hover #eaeef2`, `--radius-sm 4px`, `--radius-md 6px`, `--shadow-card 0 1px 2px rgba(31,35,40,0.06)`
  - body: flat `--bg`, no orange gradient
  - links and titles in ink, not green
  - `.button`: solid `--primary`; `.button.danger`: solid red
  - `.button.secondary`, `.icon-button`, the list «Περισσότερα» and the form's small add / remove buttons: transparent, `--hover` background on `:hover` and `:focus-visible`
  - inputs: 1 px border, 4 px corners, grey focus ring
  - the seed / sun colours in the plant form stay (they carry meaning)
- **`admin.page.tsx`:**
  - `.grid` → `minmax(220px, 1fr)`, tiles `min-height: 120px`, the count in big type
  - each tile is a `div.card.tile` with the list link over the whole tile and, for creatable types, a `<a class="button small" href="{path}/new">+ Δημιουργία</a>` in its corner (above the link)
  - `tableCounts` (or a list next to it) says which types are creatable: plants, blogs, tips, combinations
- **Check:** every dashboard page (home, lists, plant / blog / tip / combination forms, the delete-only lists) in the new theme; hover states with a mouse; keyboard focus visible.

## Testing

Expo web + Playwright with the mocked API from plans 10–11, plus a phone; the dashboard through `wrangler dev` (or its local harness) in Chromium.

| Area | Checks |
|---|---|
| X button | On a blog, post, plant and life cycle page the top-right button is an X and goes back; after a reload it goes home; on home / lists it is the search |
| Transitions (phone) | Post and blog slide up and back down; plants as before |
| Search | Bar full width over the leaf; X at the right closes it; darker overlay; results are separate cards with 8 px corners; headers light gray, centred, bigger gap above «Άρθρα»; with many results the list reaches the keyboard and scrolls, with few it is short |
| 5th tab | In the middle; opens the results with the last filters; with none, opens the filter sheet; active on /results; five tabs fit on a 360 px screen |
| Home | No «Μάθε περισσότερα»; letters pop in one by one and end on one line at their place (web and phone, with a screenshot after 2 s); the explore button's top inner glow |
| Dashboard | Grey theme everywhere; main buttons filled; others only on hover; bigger home tiles; «+ Δημιουργία» on plants / blogs / tips / combinations opens the empty form |
| Checks | `npx tsc --noEmit`, `npx expo lint` (app), `tsc` (backend) |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | X button on detail pages (morph, back) | `components/search/search-bar.tsx` |
| 2 | Posts and blogs slide from the bottom | `app/(app)/community/[id].tsx`, `app/(app)/wiki/[id].tsx` |
| 3 | Full-width bar, X close, darker overlay | `components/search/search-bar.tsx` |
| 4 | Result cards, headers, height | `components/search/search-results.tsx`, `result-row.tsx`, `theme/spacing.ts` |
| 5 | Explore sheet provider; 5th tab | `lib/explore-sheet.tsx`, `config/app.ts`, `app/(app)/_layout.tsx`, `bottom-nav.tsx`, `app/(app)/index.tsx` |
| 6 | Remove «Μάθε περισσότερα» | `app/(app)/index.tsx` |
| 7 | Letters: find the cause, fix the pop-in | `components/ui/pop-in-text.tsx`, `pop-in.ts`, `glass-text.tsx` |
| 8 | Explore button inner glow | `components/ui/action-button.tsx`, `app/(app)/index.tsx` |
| 9 | Dashboard grey theme and hover buttons | `backend/src/resources/admin/ui/styles.ts` |
| 10 | Dashboard home tiles with «+ Δημιουργία» | `backend/src/resources/admin/admin.page.tsx`, `admin.repo.ts` |
| 11 | Tests (web, phone, dashboard), typecheck, lint | scratchpad |
| 12 | **With approval:** commit, deploy the dashboard, new app build | — |

**Files not touched:** the database and the API; the plant page; the Portfolio project.

## Open items

- **Remember the filters across restarts?** Today they are lost when the app closes, so the 5th tab then opens the filter sheet. They could be saved on the phone (secure store / local storage).
- **The Portfolio reel effect** for picking a result: a later plan, once it can be checked on the PC.
- **Colours** (overlay 35%, header gray `#eceef0`, dashboard greys) are proposals, adjusted while implementing.
