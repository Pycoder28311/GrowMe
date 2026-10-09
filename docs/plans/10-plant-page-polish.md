# 10 — Plant page polish: tiles, section bar, reveals, «Τι να προσέχεις»

**Goal:** the plant page (from plan 09) gets a more finished look and feel:
- **Opening:** it slides up from the bottom when opened from a card.
- **Tiles:** the characteristics become white tiles with real icons; tapping one gives a little "not clickable" shake.
- **Section bar:** a bar of section labels between the leaf and the search button follows the scroll and jumps to a section when tapped.
- **Sections:**
  - tips get a new style
  - tips and «Τι να προσέχεις» appear from behind the first time they come into view
  - the description pops up with its letters lighting up for a moment
  - «Τι να προσέχεις» (the old Ασθένειες) is a closed dropdown whose items open their text in a bottom panel
- **«Δες την περιγραφή» button:** stays above the bottom bar until the user reaches the description.
- **Green:** the app's green gets a little more intense.

**Depends on:** plan 09 (the current plant page, `lib/flight.tsx`, the lifecycle timeline).
**Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **The plant page slides up from the bottom** when opened from a plant card (results, filtered lists). The **search keeps its "grow from the result"** effect (plan 06/09) | User |
| D2 | **The characteristics as tiles:** <br>• every yes/no characteristic (the dashboard's checkboxes), plus wind, kind and size, is a **white tile** with a rounded (smaller) corner and a small shadow <br>• the **icon** sits top-left in a **rounded, faded-colour circle**, the icon itself light gray <br>• the label is below it <br>• the tiles replace plan 09's chips under the scientific name | User |
| D3 | **Tapping a tile** (or any other non-tappable fact tile) gives a short **shake** (~300 ms, ±4 px), so the user sees it isn't a button. With Reduce Motion: a quick dim instead | User |
| D4 | **Real icons, not emoji,** across the plant page: tiles, the facts card (sun, difficulty, season, lifespan), the origin pill and section titles. Icons come from `components/ui/icon.tsx` (SF Symbols on iOS, Material Symbols on Android and web), with new names added there | User |
| D5 | **Green:** the **app's** theme green (`colors.primary`, `colors.primarySoft`) becomes a little more saturated. The dashboard keeps its green | User |
| D6 | **Lifecycle:** no change. The remarks were about the old card, which plan 09 replaced | User |
| D7 | **«Τι να προσέχεις»** replaces «Ασθένειες» in the dashboard form (section title, item name, placeholder) and on the plant page. The data (`diseases`) stays as it is | User |
| D8 | **On the plant page it's a dropdown, closed by default.** Open, it lists each item's title (and label) with a **link icon**. A tap opens a **bottom panel** with the full text (`LinkedText`), like the blog-link panel | User |
| D9 | **Tips:** no bullets; each tip is a **light gray block with no corner radius and a thick yellow-orange bottom border** (4 px), with a small gap between tips; the title is bold, then the text | User |
| D10 | **Reveals** (each once per page visit, when the section first comes into view): <br>• tips and «Τι να προσέχεις» rise **from behind** (from scale 0.92, 16 px lower and transparent to full) <br>• the **description pops up** (a spring scale) and its **text lights up** for a moment (a light colour fading to ink over ~900 ms) <br>With Reduce Motion: shown with no movement | User |
| D11 | **The section bar** sits between the leaf and the search button: a horizontal carousel of labels for the sections the plant has: Φωτογραφίες · Πληροφορίες · Κύκλος ζωής · Συμβουλές · Τι να προσέχεις · Περιγραφή · Συνδυασμοί <br>• the label of the section **at the centre of the screen** is highlighted and kept centred in the bar <br>• a tap scrolls the page to that section <br>• **no background**, only a soft shadow on the text <br>• **the text colour adapts:** white with a dark shadow while it's over the photos, ink with a light glow over the plain page <br>• it hides while the search is open | User |
| D12 | **«Δες την περιγραφή»:** a short, full-width button just above the bottom bar, shown while the plant has a description and the user hasn't reached it. A tap scrolls to the description. It disappears once the description is on screen (or above it) and comes back when the user scrolls up past it | User |
| D13 | **Tile icons and tints** come from one list next to `PLANT_FLAGS` in the app, `config/plant-icons.ts` (a key → icon name and tint). Wind, kind and size get their own entries | Default |
| D14 | **Tiles layout:** a 2-column grid. Each tile is 12 px radius (`radius.sm`), with a small shadow under it (`shadow.card` softened) | Default |
| D15 | **The page tracks its sections** (top `y` of each, from `onLayout`) and its scroll position in one small hook, `usePageSections`. The section bar, the reveals and the description button all read from it, so there's one source of truth | Default |
| D16 | **The section bar** is put between the corners through a small context in `AppShell` (`usePageHeader(node)`), so other pages can use the same slot later. Only the plant page fills it for now | Default |
| D17 | **No new packages:** no haptics library and no gradient library. The shake and the light-up are Reanimated (already installed) | Default |

## 1 — Risks and blockers

1. **The slide-up animation** is a native-stack animation (`slide_from_bottom`). It runs on iOS and Android; **on web expo-router shows no transition** (it stays as it is today). Test the slide on a phone.
2. **The new green must keep text readable:** green text on white and white on green must stay at least 4.5:1. The chosen value must be checked (e.g. `#1f7f3a` ≈ 5.1:1 on white) before changing it, because the whole app uses `colors.primary`.
3. **Too much motion** on one page: tile shake, reveals, light-up, the bar's centring and the lifecycle teaser. Everything respects Reduce Motion, and each reveal happens once per visit.
4. **Missing icons:** a few icons may not exist in both SF Symbols and Material Symbols (e.g. "climbing"). The plan lists a fallback for each; check them on iOS too (web/Android use Material).
5. **The dashboard rename** changes only labels; the API and database keep `diseases`.

## 2 — Architecture

```
app/(app)/_layout.tsx        Stack.Screen 'plants/[id]/index': animation from the route param `via`
                             (via=search → fade; otherwise slide_from_bottom)
components/layout/app-shell  PageHeaderProvider: a slot between the corners (usePageHeader)
plants/[id]/index.tsx        usePageSections → { register(id), scrollY, current, scrollTo(id), seen(id) }
  ├─ SectionBar (into the header slot)      current, onPick → scrollTo
  ├─ PlantTiles (ShakeOnTap)                characteristics
  ├─ PlantFacts (icons, ShakeOnTap rows)
  ├─ LifecycleCard (unchanged)
  ├─ TipsList        <Reveal from="behind">
  ├─ WatchOutList    <Reveal from="behind">   dropdown + TextPanel
  ├─ Description     <Reveal from="pop"> + LightUpText
  ├─ Combinations
  └─ DescriptionButton (absolute, above the bottom nav)
```

## 3 — Opening from the bottom

- **`app/(app)/_layout.tsx`:** add `<Stack.Screen name="plants/[id]/index" options={({ route }) => ({ animation: route.params?.via === 'search' ? 'fade' : 'slide_from_bottom' })} />` inside the `Stack`. The other screens keep `fade`. Check the API in the SDK 57 expo-router docs (`AGENTS.md`).
- **`components/search/search-bar.tsx`:** the plant push adds `via: 'search'` to its params, so the flight lands on a page that fades.
- **The lifecycle page** (`[id]/lifecycle`) keeps `fade`, since the flight grows into it.
- **`components/plants/plant-card.tsx`** pushes as today, which gives the slide.

## 4 — Tiles, icons and the shake

- **`components/ui/icon.tsx`:** new names (iOS / Material):

  | Name | iOS | Material |
  |---|---|---|
  | sun | `sun.max` | `light_mode` |
  | gauge | `gauge.with.dots.needle.50percent` | `speed` |
  | calendar | `calendar` | `calendar_month` |
  | hourglass | `hourglass` | `hourglass_empty` |
  | food | `fork.knife` | `restaurant` |
  | aroma | `leaf.circle` | `spa` |
  | climbing | `arrow.up.right` | `north_east` |
  | ornamental | `sparkles` | `auto_awesome` |
  | succulent | `drop` | `water_drop` |
  | privacy | `eye.slash` | `visibility_off` |
  | sea | `water.waves` | `waves` |
  | frost | `snowflake` | `ac_unit` |
  | wind | `wind` | `air` |
  | flower | `camera.macro` | `local_florist` |
  | tree | `tree` | `park` |
  | ruler | `ruler` | `straighten` |
  | link | `link` | `link` |
  | chevronDown | `chevron.down` | `expand_more` |

  `leaf` and `location` already exist.
- **`config/plant-icons.ts`:**
  - `FLAG_ICONS: Record<PlantFlag, { icon: IconName; tint: string }>`
  - `KIND_ICONS`, `WIND_ICON`, `SIZE_ICON`
  - tints are faded colours (e.g. `#e3f1e6`, `#fdebd3`, `#e2ecf8`, `#f6e3ef`…)
- **`components/ui/shake-on-tap.tsx`:**
  - wraps a non-interactive element in a `Pressable`
  - on press it runs `withSequence` of `translateX` (±4, 3 swings, ~300 ms total)
  - with Reduce Motion: an opacity dip
  - `accessibilityRole` stays `text`, with no hint, so screen readers don't announce a button
- **`components/plants/plant-tiles.tsx`** (replaces `plant-badges.tsx`):
  - `plantTiles(plant)` gives `{ key, icon, tint, label }[]` (from `visibleFlags` + wind/kind/size)
  - a 2-column grid of `ShakeOnTap` tiles
  - each tile: white, `radius.sm`, a soft shadow, padding `space.sm`
  - inside: a 32 px tinted circle with a light gray (`#9ca3af`) icon, then the label (small, ink)
- **`components/plants/plant-facts.tsx`:**
  - the emoji become `Icon`s, in the same tinted circle, smaller
  - each row is wrapped in `ShakeOnTap`
  - the origin pill uses the `location` icon
- **`config/plant-traits.ts`:** the `Trait.emoji` values used by the plant page move to icon names, keeping the emoji for the plant card. Small cards stay as they are, unless you say otherwise (see Open items).

## 5 — The section bar

- **`components/layout/page-header.tsx`:**
  - `PageHeaderProvider` holds one node
  - `usePageHeader(node)` sets it while the page is focused (`useFocusEffect`) and clears it on blur
  - `AppShell` renders it between the corners, absolutely positioned (from `space.md + size.touch + space.sm` on each side), at the corners' height
  - `TopCorners` exposes `searching`, so the slot hides while the search is open
- **`lib/page-sections.ts` `usePageSections(order)`:**
  - `register(id)` returns an `onLayout` that stores each section's top
  - `onScroll` keeps `scrollY` (shared value + ref) and the viewport height
  - `current` = the last section whose top is above the screen's middle
  - `scrollTo(id)` scrolls so the section starts just under the header (`useTopClearance`)
  - `onFirstSeen(id, fn)` fires once, when a section's top first passes 85% of the screen height
- **`components/plants/section-bar.tsx`:**
  - a horizontal `ScrollView` of labels; the current one is bold and full-colour, the others 70% opacity
  - after each change it scrolls itself so the current label is centred (measure each label's `x` and width)
  - **text colour:** `onPhotos` (scrollY < gallery height − top clearance) gives white text with `textShadow` dark; otherwise ink with a white `textShadow`
  - each label is a `PressableScale` with `accessibilityRole="tab"` and `accessibilityState.selected`
- **Sections and ids:** `images` (only with photos), `info` (tiles + facts), `lifecycle`, `tips`, `watch-out`, `description`, `combinations`. Only the sections the plant has.

## 6 — Tips, «Τι να προσέχεις», description

- **`components/plants/tips-list.tsx`:**
  - each tip is a `View` with background `#f3f4f6`, `borderRadius: 0`, `borderBottomWidth: 4`, `borderBottomColor: '#f5a524'` (yellow-orange) and padding `space.sm`/`space.md`
  - the list gap is `space.xs`
  - the content is the title (bold) and `LinkedText`; no `BulletList`
- **`components/plants/watch-out-list.tsx`:**
  - a header row «Τι να προσέχεις (N)» with `chevronDown`, rotating when open, closed by default, `accessibilityState.expanded`
  - open, it shows the items with Reanimated `FadeIn`/`LinearTransition`: title (+ label muted) and a `link` icon on the right
  - a tap opens `TextPanel`
- **`components/ui/text-panel.tsx`:**
  - a small provider-free bottom sheet that reuses `components/ui/bottom-sheet.tsx` (as `lib/blog-preview.tsx` does)
  - shows the title, the label and the full `LinkedText`
- **`components/motion/reveal.tsx`:**
  - `Reveal({ from: 'behind' | 'pop', visible, children })`
  - `behind`: scale 0.92 → 1, translateY 16 → 0, opacity 0 → 1, 450 ms, `Easing.out(Easing.cubic)`
  - `pop`: a spring scale 0.85 → 1, opacity 0 → 1
  - before it is seen, the content is laid out but transparent, so section tops don't move
- **`components/motion/light-up-text.tsx`:** an `Animated.Text` whose colour goes from a light highlight (`#ffe8a3`) to `colors.ink` over ~900 ms when `play` turns true. The description uses it (its blog links keep their colour via `LinkedText` inside).
- **`[id]/index.tsx`:** wire `onFirstSeen('tips' | 'watch-out' | 'description')` to each `Reveal`'s `visible`.

## 7 — «Δες την περιγραφή»

- **`components/plants/description-button.tsx`:**
  - full width minus `space.md` on each side, short (40 px)
  - `colors.primary` text on white with a soft shadow, a `chevronDown` icon
  - positioned absolutely at the page's bottom (above the bottom nav, which the page already sits on)
- **Visible** when `plant.description` exists and the description's top is below the screen's bottom (`scrollY + viewport < descriptionTop`). It fades and slides out when hidden.
- **A tap** calls `scrollTo('description')`.
- **The page's bottom padding** grows by the button's height while it shows, so the last content isn't hidden.

## 8 — Green and the dashboard rename

- **`app/src/theme/colors.ts`:**
  - `primary`: `#2f7a3e` → a more saturated green, e.g. `#1f7f3a`; check ≥ 4.5:1 with white and with `primarySoft`
  - `primarySoft`: a matching soft tint (e.g. `#d8f0de`)
  - update the comments; the dashboard's `styles.ts` tokens stay unchanged (D5)
- **`backend/src/resources/admin/plants/plants.admin.tsx`:** the diseases list gets `title="Τι να προσέχεις"`, `itemLabel="Θέμα"`, and the title placeholder «Τι να προσέχεις (π.χ. Αφίδες)». The admin's Greek error messages don't mention diseases, so they stay.

## Testing

Expo web and Playwright with the plan 09 harness:
- local backend with `--local-upstream localhost:8787`
- the app's production calls routed to it
- a verified local test user
- plants seeded through the admin API with photos, tips, «Τι να προσέχεις» items and a description
- open plants through in-app navigation (a full reload lands on home)

| Area | Checks |
|---|---|
| Tiles | One per visible characteristic + wind/kind/size; icons render (no emoji in the page text); tapping a tile moves it (transform changes) and doesn't navigate |
| Section bar | Labels only for existing sections; scrolling changes the highlighted label and centres it; a tap scrolls to that section; white text over the photos, ink below; hidden while the search is open |
| Reveals | Tips and «Τι να προσέχεις» are transparent before scrolling to them and visible after; the description's colour animates from the highlight to ink; with Reduce Motion (emulated `prefers-reduced-motion`) everything is visible at once |
| «Τι να προσέχεις» | Closed by default; opens and closes; a tap opens the panel with the full text; the dashboard shows the new names |
| Description button | Visible at the top; hidden once the description is on screen; back after scrolling up; a tap reaches the description |
| Green | The new value is in use; contrast checked with a small script |
| Phone (Expo Go / dev build) | Slide-up from a card, fade from the search; shake; bar scrolling; icons on iOS and Android |
| Checks | `npx tsc --noEmit`, `npx expo lint` (app), `tsc` (backend) |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | New icons; `config/plant-icons.ts` | `components/ui/icon.tsx`, `config/plant-icons.ts` |
| 2 | `ShakeOnTap`; `PlantTiles` (replaces `PlantBadges`); facts with icons | `components/ui/shake-on-tap.tsx`, `components/plants/plant-tiles.tsx`, `plant-facts.tsx` |
| 3 | Slide-up opening (stack option + `via=search`) | `app/(app)/_layout.tsx`, `components/search/search-bar.tsx` |
| 4 | `usePageSections` and the section ids on the plant page | `lib/page-sections.ts`, `app/(app)/plants/[id]/index.tsx` |
| 5 | Header slot and `SectionBar` | `components/layout/page-header.tsx`, `app-shell.tsx`, `components/plants/section-bar.tsx`, `components/search/search-bar.tsx` |
| 6 | `Reveal`, `LightUpText` | `components/motion/reveal.tsx`, `light-up-text.tsx` |
| 7 | Tips list; «Τι να προσέχεις» dropdown + `TextPanel` | `components/plants/tips-list.tsx`, `watch-out-list.tsx`, `components/ui/text-panel.tsx` |
| 8 | «Δες την περιγραφή» button | `components/plants/description-button.tsx` |
| 9 | Green in the app theme (contrast check) | `app/src/theme/colors.ts` |
| 10 | Dashboard rename | `backend/src/resources/admin/plants/plants.admin.tsx` |
| 11 | Tests (web + phone), typecheck, lint | scratchpad |
| 12 | **With approval:** commit, deploy (dashboard labels), new app build | — |

**Files not touched:**
- the database, migrations and the API
- the dashboard's colours
- the lifecycle timeline
- `Personal/Portfolio`, `Experiments/plant demo`, the TakeTheTrip codebase

## Open items

- **Small plant cards** (results list) still use emoji for sun, difficulty, food and origin. Say if they should switch to icons too.
- **Tile tints** are proposals (one faded colour per characteristic); say if you'd prefer one colour for all.
- **The exact green** is chosen while implementing (≥ 4.5:1 contrast); you'll see it on the first build.
