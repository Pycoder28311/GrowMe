# 11 — Plant page redesign: photo header, animated info tiles, sun bar, lifecycle, combinations

**Goal:** the plant page follows the new Penpot wireframe:
- **Photo header:** the photos fade into the page through a white gradient; the thumbnails sit centred on that edge. Scrolling pushes the photos back, the white covers the screen, and the thumbnails fly to the top right and stack like Instagram's «Instants». A tapped thumbnail slides to the centre of the screen over a blurred page. The page's white turns light orange as you scroll down.
- **Info tiles:** each tile has its icon top-left and a small animation on the right (no background), one per value (also for some «false» values).
- **Sun:** no card behind it; a light-orange bar with thin black marks every 3 hours, and a sun icon for morning / noon / evening.
- **Rows:** μικρό δέντρο, origin, κοντά στη θάλασσα and ιδιωτικότητα as one-line gray rows.
- **Lifecycle:** two big buttons («Από σπόρο», «Μεταμφύτευση») that light up for the group on screen; the stages in one rounded gray box; «Μεταμφύτευση» separates the seed part and pushes it behind.
- **«Τι να προσέχεις»:** no press-shrink on its button.
- **Combinations:** cards with arrows, 1⅓ cards on screen, before a new «Σχετικά φυτά» section.

**Depends on:** plan 10 (section bar, `usePageSections`, reveals, tiles, `plant-icons.ts`).
**Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Order of the page** (wireframe): photos → name, price, scientific name → info tiles → sun → rows → lifecycle → tips → «Τι να προσέχεις» → description → **combinations → related plants** | User |
| D2 | **Plan 10's extras stay:** section bar between the corners, «Δες την περιγραφή» button, reveals, light-up text, tile shake. The section bar gets a «Σχετικά φυτά» label | User |
| D3 | **Photo edge:** the photos end in a **white gradient** (transparent → page colour, ~96 px) instead of the hard edge. The **thumbnails sit centred on that edge**, half over the photo. The arrows stay | User |
| D4 | **While scrolling down:** the photo area is **pushed back** (scale 1 → 0.9, slight upward parallax, opacity 1 → 0) and the page colour covers the screen smoothly. The thumbnails **slide to the top right**, just below the search button, and **stack half-hidden one under the other**, slightly rotated like Instagram «Instants». Scrolling back up reverses it | User |
| D5 | **Tapping a thumbnail** (in either place): the photo **slides smoothly from the thumbnail to the centre** of the screen, full width, with the **whole page blurred** behind it. A tap on the background (or back / swipe down) slides it back | User |
| D6 | **Background colour:** the page goes from **white at the top to light orange** (`#fff1e0`, proposal) as you scroll, interpolated by scroll progress over the whole page height | User |
| D7 | **Info tiles** (the wireframe's two-up rectangles): icon top-left, label below it, **a small animation on the right, no background**. Tiles: **wind, months (date ranges), αναρριχητικό, καλλωπιστικό, παχύφυτο, βρώσιμο, αρωματικό, kind, χειμώνας (frostHardy), δυσκολία, μέγεθος** | User |
| D8 | **Shown when false too:** **βρώσιμο** («Μη φαγώσιμο») and **παχύφυτο** («Λεπτά φύλλα»), each with its own «false» animation. **frostHardy stops showing when false** (today it shows «Ευαίσθητο στον παγετό») — see Open items. The others show only when true / set | User |
| D9 | **Multi-value fields get one animation per value:** wind (4 levels), kind (3), difficulty (3), size (3), and the month ranges (one per season the range mostly falls in) | User |
| D10 | **Animations are drawn in code:** `react-native-svg` (in Expo Go) shapes moved by Reanimated. No asset files. Each loops gently; with Reduce Motion they are still drawings | User |
| D11 | **Sun part:** **no card background**. The bar keeps its shape but the span is **one light orange** (`#ffb867`, proposal), no night colours. **Thin black vertical marks every 3 hours** (1 px, at 3, 6 … 21). The icon top-left is a **sun for the part of the day**: sunrise (morning), full sun (noon), sunset (afternoon / evening) | User |
| D12 | **Rows under the sun:** μικρό δέντρο, origin (native), κοντά στη θάλασσα, ιδιωτικότητα. Each a **gray rounded row, one sentence, at most one line** (`numberOfLines={1}`). Shown only when true / set. Μικρό δέντρο gets a sentence («Μεγαλώνει σαν μικρό δέντρο», proposal) | User |
| D13 | **Lifecycle head:** «Κύκλος ζωής» on the left, the **lifespan** («2–3 χρόνια») with its icon on the right, as in the wireframe | User |
| D14 | **Two big buttons** «Από σπόρο» | «Μεταμφύτευση» replace `JumpButton`. The one whose stages **take more of the screen** is lit (full colour), the other dimmed. Only shown when the plant has both groups | User |
| D15 | **Stages** sit in **one rounded gray parent box**, rows separated by a thin line: title (bold, left), duration (right), the description (teaser) below. **No inner scroll** (the old 420 px box goes); the page scrolls. «Δες περισσότερα» and the flight to the lifecycle page stay | User |
| D16 | **Tapping «Από σπόρο»** scrolls the page so the seed stages are in view | User |
| D17 | **Tapping «Μεταμφύτευση»:** the seed part **separates** from the parent box (the box splits along the line between the groups, both halves get their own rounded corners), the seed half **sinks behind** (scale 0.92, darkens, translates under the plant half, fades), and the plant half **moves up** to where the seed stages started. The page scrolls with it so the plant stages start under the buttons | User |
| D18 | **Then tapping «Από σπόρο» reverses it:** the seed half comes out from behind, the plant half moves down, the box joins again, and the page scrolls to the seeds | User |
| D19 | **«Τι να προσέχεις»:** the header button **no longer shrinks when pressed** (`Pressable` instead of `PressableScale`). The chevron rotation and the open/close transition stay | User |
| D20 | **Combinations: one card per other plant in the same combination** (`GET /api/plants?combinationId=…`, the plant itself left out). Card (wireframe): photo on top, name, short description (2 lines), «Δες περισσότερα» button → that plant's page. No database change | User |
| D21 | **Combination carousel:** **1⅓ cards visible**, card width = `(screen − margins) / (4/3)` minus the gap. **‹ › buttons like the photo gallery** (`ArrowButton`); a press brings the next / previous card **aligned to the left edge** (not centred). Swiping snaps the same way (`snapToInterval`) | User |
| D22 | **Related plants («Σχετικά φυτά»):** computed in the app from `usePlants()`: same **kind**, then the most shared flags and the same sun part; excluding the plant itself and its combination's plants; up to 8. **Same carousel and cards as combinations.** Hidden when none | User |
| D23 | **New packages:** `react-native-svg` (animations, sun icons, gradient) and `expo-blur` (the blurred page behind a photo), both via `npx expo install`, both in Expo Go | Default |
| D24 | **Scroll-driven effects run on the UI thread:** the page's `ScrollView` becomes `Animated.ScrollView` with `useAnimatedScrollHandler`; `usePageSections` keeps its JS `onScroll` for sections (both handlers composed) | Default |

## 1 — Risks and blockers

1. **Thumbnails moving between two places** (photo edge → top-right stack) while the page scrolls: they are drawn in an **overlay above the ScrollView** (not inside it), positioned from the scroll value, so they can leave the scrolled content. Must not cover the search button or the section bar.
2. **Blur on Android:** `expo-blur` on Android needs `experimentalBlurMethod="dimezisBlurView"` and is heavier; fall back to a dark semi-transparent overlay if it stutters. On web it uses CSS `backdrop-filter`.
3. **Lifecycle split animation:** the halves change height and position while the page also scrolls. Measure both halves once (`onLayout`), animate with transforms only (no layout changes during the animation), then commit the final layout. Test on a slow Android phone.
4. **"More visible" button:** needs each group's on-screen height from the scroll value and the measured tops; done in a worklet, sets state only when the lit button changes.
5. **Many animations at once** (tiles, header, background colour): tile animations pause when off-screen (they only run while the info section is in view) and all respect Reduce Motion.
6. **Background colour over the whole page:** the `AppShell` background sits behind; the plant page paints its own animated background view, so other pages are unchanged.
7. **Related plants need the list of plants** (`usePlants()`); if it's large, compute once with `useMemo`.

## 2 — Architecture

```
plants/[id]/index.tsx       Animated.ScrollView, scrollY (shared) + usePageSections
  ├─ PageTint                  animated background: white → light orange
  ├─ PhotoHeader               photos + arrows + white gradient; pushed back by scrollY
  ├─ PhotoStack (overlay)      thumbnails: on the edge → stacked top right (by scrollY)
  ├─ PhotoLightbox             a tapped photo slides to the centre over a BlurView
  ├─ InfoTiles                 tile = icon + label + <TileAnimation kind value/>
  ├─ SunBar                    light-orange span, 3-hour marks, SunIcon(part)
  ├─ TraitRows                 μικρό δέντρο · origin · θάλασσα · ιδιωτικότητα
  ├─ LifecycleSection          GroupButtons + StagesBox (split / join animation)
  ├─ Tips, WatchOutList (no press shrink), Description
  ├─ PlantCarousel «Συνδυασμοί με αυτό το φυτό»
  └─ PlantCarousel «Σχετικά φυτά»
```

## 3 — Photo header

- **`components/plants/photo-header.tsx`** (replaces `plant-gallery.tsx` on this page):
  - the swipeable photos and arrows as today (`PHOTO_HEIGHT` 280)
  - at the bottom, an SVG `LinearGradient` (transparent → the page colour) 96 px high
  - animated style from `scrollY`: `scale` 1 → 0.9 and `opacity` 1 → 0 over the first `PHOTO_HEIGHT` px, `translateY` at half speed (pushed back)
  - the gradient's bottom colour follows the page tint (D6), so the seam never shows
- **`components/plants/photo-stack.tsx`** (overlay, absolutely placed over the page):
  - each thumbnail interpolates between two positions by scroll progress `p` (0 at top, 1 after `PHOTO_HEIGHT − topClearance`):
    - `p = 0`: a centred row on the gradient edge (as the wireframe)
    - `p = 1`: stacked under the search button: same `x` (right corner), each `size.touch × 0.55` lower than the one before (half hidden), rotated by −6°, +4°, −3°… and the first on top (`zIndex`)
  - the movement is staggered per thumbnail (each starts a little later) so they "fly" one after the other
  - with one photo: one thumbnail; with none: no header and no stack
- **`components/plants/photo-lightbox.tsx`:**
  - on tap, measure the thumbnail (`measureInWindow`) and animate a copy of the photo from that rect to the centre (full width, aspect kept), `withTiming` 350 ms, `Easing.out(Easing.cubic)`
  - behind it, an `expo-blur` `BlurView` (intensity 0 → 40) over the whole screen
  - close: tap outside, Android back, swipe down → the reverse animation, back to the thumbnail's current place
  - left/right swipe in the lightbox moves to the next photo (nice to have)
- **`components/plants/page-tint.tsx`:** an absolute view behind the ScrollView whose `backgroundColor` is `interpolateColor(scrollY, [0, contentHeight − viewport], ['#ffffff', '#fff1e0'])`. Exports the current colour as a shared value for the gradient.

## 4 — Info tiles and their animations

- **`config/plant-tiles.ts`** (new): the tile list for a plant, from the fields:

  | Tile | Values → one animation each | Shown |
  |---|---|---|
  | Αέρας (wind) | strong: wind turbine spinning fast · moderate: turbine slow · light: a leaf drifting · sheltered: a small wall with a leaf behind, still | when set |
  | Φύτεμα (month ranges) | one per season of each range: spring a bud opening · summer sun pulsing · autumn leaf falling · winter snowflake turning (up to 3 ranges → a row of up to 3 small drawings) | when set |
  | Αναρριχητικό | a vine curling up a stick | true |
  | Καλλωπιστικό | a flower opening and closing | true |
  | Παχύφυτο | true: a plump succulent rosette breathing · **false: a thin leaf swaying** | **always** |
  | Βρώσιμο | true: **a tomato hanging from a node, shaking a little like ready to fall** · **false: the tomato greyed with a small crossed circle, still** | **always** |
  | Αρωματικό | a sprig with scent curls rising | true |
  | Είδος (kind) | flowers: petals spinning slowly · leaves: **a big πλάτανος leaf** swaying · bush: a round bush rustling | when set |
  | Χειμώνας (frostHardy) | a snowflake falling on a leaf that stays green | true |
  | Δυσκολία | easy: a watering can tilting once · medium: two drops · hard: a gauge needle near the top, trembling | always (required field) |
  | Μέγεθος | small / medium / large: a pot with a plant growing to 1 / 2 / 3 heights | when set |

  Labels come from `PLANT_FLAGS`, `WIND_LABELS`, `PLANT_KIND_LABELS`, `PLANT_SIZE_LABELS`, `DIFFICULTY_LABELS`, `seasonTrait`.
- **`packages/shared/src/plant-fields.ts`:** `food.no` = «Μη φαγώσιμο» (D8); `frostHardy.no` = null (D8, see Open items). The plant card keeps its own text.
- **`components/plants/tile-animations/`** — one file per tile kind (`wind.tsx`, `months.tsx`, `food.tsx`…), each a ~56×56 SVG with Reanimated `useAnimatedProps` (rotate, translate, scale), looped `withRepeat`. A `TileAnimation({ tile, value, playing })` picks the right one.
- **`components/plants/plant-tiles.tsx`:** the tile becomes a row: left column icon (`IconCircle`) + label, right the animation. Still a 2-column grid with `ShakeOnTap`. `playing` = the info section is on screen (from `usePageSections`) and Reduce Motion is off.

## 5 — Sun bar

- **`components/plants/sun-graph.tsx`:**
  - remove the night parts and the card (the `FactRow` wrapper goes for the sun; `PlantFacts` keeps difficulty / season / lifespan only where they're not tiles now — see 6)
  - track: light gray, span `#ffb867`
  - marks: `View`s 1 px wide, black at 60% opacity, at hours 3, 6, 9, 12, 15, 18, 21, full track height
  - ticks under the bar stay at 0, 6, 12, 18, 24
  - text: «2 ώρες ήλιου» left, «12:00 – 14:00» right; under the bar the short sentence «Οι ιδανικές ώρες του φυτού έκθεσης στο φως μέσα στη μέρα» (wireframe)
- **`components/plants/sun-icon.tsx`:** SVG suns by `sunPart`: morning = half sun over a horizon with an up arrow, noon = full sun with rays, afternoon = half sun with a down arrow and warmer colour.

## 6 — Rows and what leaves `PlantFacts`

- **`components/plants/trait-rows.tsx`:** gray rounded rows (`#e9e9ec`, `radius.md`, padding `space.sm`/`space.md`), one line each, a small icon at the start. In order: μικρό δέντρο, origin (`LinkedText`, blog links kept), κοντά στη θάλασσα, ιδιωτικότητα.
- These four flags leave the tiles (they were tiles in plan 10).
- **`PlantFacts`** is removed from the page: sun → `SunBar`, difficulty and season → tiles, lifespan → lifecycle head (D13), origin → rows. If the plant has no lifecycle, the lifespan is the last row.

## 7 — Lifecycle

- **`components/plants/lifecycle/group-buttons.tsx`:** two big rounded buttons side by side (wireframe). Props `lit: StageGroup`, `onPick(group)`. The lit one is full colour (seed: `colors.seed`, plant: `colors.primary`), the other gray.
- **`lit`** comes from the page: on each scroll frame (worklet), the visible height of each group's box = overlap of `[top, bottom]` with the viewport; the larger wins; `runOnJS` only on change. When the seed part is pushed behind, `plant` is lit.
- **`components/plants/lifecycle/stages-box.tsx`** (replaces the compact `LifecycleTimeline` on this page; the full lifecycle page keeps the timeline):
  - two halves: `SeedHalf` and `PlantHalf`, each a list of rows (title, duration, teaser, «Δες περισσότερα», thin divider)
  - **joined** (default): one gray box; the seed half has top corners, the plant half bottom corners
  - **split** (after «Μεταμφύτευση»), one shared value `split` 0 → 1, 600 ms:
    1. 0 → 0.3: a gap opens between the halves (plant half moves down 12 px) and both get four rounded corners
    2. 0.3 → 1: the seed half goes **behind** (`zIndex` below, scale 0.92, darker, opacity → 0, translates down under the plant half); the plant half translates up by the seed half's height
    3. at 1: the seed half is taken out of the layout (`height` 0) in one frame and the translate reset, so nothing jumps
  - at the same time the page scrolls so the plant stages start under the buttons
  - **«Από σπόρο» while split:** the reverse (layout restored first, then translate back from −seedHeight to 0), then the page scrolls to the seeds (D18)
  - with Reduce Motion: a cross-fade, no movement
- **`lifecycle-card.tsx`:** head row (D13), `GroupButtons`, `StagesBox`. The teaser (`useTeaser`) stays. `JumpButton` and `onRevealOutside` are no longer used by the page.

## 8 — «Τι να προσέχεις»

- **`components/plants/watch-out-list.tsx`:** the header `PressableScale` → `Pressable` (opacity 0.7 while pressed for feedback). Nothing else changes.

## 9 — Combinations and related plants

- **`lib/plants.ts`:** `useCombinationPlants(combinationId, exceptId)` (from `plantsApi` with `combinationId`), and `relatedPlants(plant, all, exclude)` for D22 (score: same kind +3, each shared true flag +1, same sun part +1; ties by name, `el`).
- **`components/plants/plant-carousel.tsx`:**
  - a horizontal `ScrollView`, `snapToInterval = cardWidth + gap`, `decelerationRate="fast"`, `snapToAlignment="start"`, left padding = page margin
  - `cardWidth = (width − 2·space.md − gap) × 3/4` so 1⅓ cards show
  - ‹ › `ArrowButton`s over the cards' vertical middle; `scrollTo({ x: index·(cardWidth+gap) })`; disabled at the ends
- **`components/plants/combo-card.tsx`:** gray rounded card (wireframe): photo (rounded, ~60% of the card height), name (bold), description (2 lines), «Δες περισσότερα» full-width small pill at the bottom → `router.push('/plants/[id]')`.
- **Page:** «Συνδυασμοί με αυτό το φυτό» (hidden when the plant has no combination or it has no other plants — the placeholder goes), then «Σχετικά φυτά». Both registered as sections (`combinations`, `related`).

## Testing

Expo web + Playwright with the plan 09/10 harness (local backend, seeded plants with photos, both lifecycle groups, a combination of 4 plants, plants of the same kind), plus a phone.

| Area | Checks |
|---|---|
| Header | Gradient at the photo edge; thumbnails centred on it; scrolling scales/fades the photos and moves the thumbnails to a top-right stack below the search button; scrolling up returns them |
| Lightbox | A tap slides the photo to the centre; the page behind is blurred; tap outside closes it back to the thumbnail |
| Tint | Background white at the top, light orange at the bottom |
| Tiles | The right tiles for a plant (incl. «Μη φαγώσιμο» / «Λεπτά φύλλα» when false; no frost tile when false); each has an animation (transform changes over time); still with Reduce Motion |
| Sun | No card; light-orange span; 7 marks; the right sun icon for 8–11, 11–15, 15–19 windows |
| Rows | Only the true / set ones; one line each |
| Lifecycle | The lit button follows the scroll; «Από σπόρο» scrolls to seeds; «Μεταμφύτευση» splits, seed half disappears behind, plant stages move up; «Από σπόρο» brings them back; «Δες περισσότερα» still opens the lifecycle page |
| «Τι να προσέχεις» | No scale on press; still opens and closes |
| Carousels | 1⅓ cards visible; › aligns the next card to the left edge; ‹ back; disabled at the ends; a card opens its plant; related plants exclude the plant and its combination |
| Phone | Smooth scroll on Android (header, tint, tiles), blur on iOS and Android |
| Checks | `npx tsc --noEmit`, `npx expo lint` (app), `tsc` (shared, backend) |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Install `react-native-svg`, `expo-blur` | `app/package.json` |
| 2 | Animated scroll + `PageTint` | `plants/[id]/index.tsx`, `components/plants/page-tint.tsx`, `lib/page-sections.ts` |
| 3 | `PhotoHeader` (gradient, push back) | `components/plants/photo-header.tsx` |
| 4 | `PhotoStack` (edge → Instants stack) | `components/plants/photo-stack.tsx` |
| 5 | `PhotoLightbox` (slide to centre, blur) | `components/plants/photo-lightbox.tsx` |
| 6 | Tile list, flag phrases (food/frost) | `config/plant-tiles.ts`, `packages/shared/src/plant-fields.ts` |
| 7 | Tile animations (≈25 small drawings) | `components/plants/tile-animations/*` |
| 8 | Tile layout with the animation | `components/plants/plant-tiles.tsx` |
| 9 | Sun bar + sun icons | `sun-graph.tsx`, `sun-icon.tsx` |
| 10 | Trait rows; remove `PlantFacts` from the page | `trait-rows.tsx`, `plants/[id]/index.tsx` |
| 11 | Lifecycle: head, group buttons, stages box, split/join, lit button | `lifecycle/group-buttons.tsx`, `stages-box.tsx`, `lifecycle-card.tsx` |
| 12 | «Τι να προσέχεις» without press shrink | `watch-out-list.tsx` |
| 13 | Combination + related carousels | `lib/plants.ts`, `plant-carousel.tsx`, `combo-card.tsx`, `section-bar` labels |
| 14 | Tests (web + phone), typecheck, lint | scratchpad |
| 15 | **With approval:** commit, new app build | — |

**Files not touched:** the database, migrations and the API; the dashboard; the full lifecycle page (`[id]/lifecycle.tsx` keeps the timeline).

## Open items

- **frostHardy false:** today the page shows «Ευαίσθητο στον παγετό». You chose only βρώσιμο and παχύφυτο to show when false, so this tile disappears when false. Say if it should stay.
- **Colours** (light orange page `#fff1e0`, sun span `#ffb867`) and **sentences** for the rows (e.g. μικρό δέντρο) are proposals, chosen while implementing.
- **«Night» sun icon:** the sun window can't be at night, so the third icon is **afternoon / sunset**. Say if you meant something else.
- **The animations' style** (flat, 2–3 colours, thin outlines) — you'll see a first batch (wind, βρώσιμο, kind) before the rest are drawn.
