# 18 — Botanical theme for the whole app

**Goal:** the plant page's look (its colours, corner radii, shadows, paper grain and drifting flowers) lives in one shared token file, and every screen of the Expo app uses it. Positions, layouts and component structure stay as they are: only colours, radii, shadows, backgrounds and title fonts change. The backend admin is not touched.

**Depends on:** plan 17 (plant page redesign) and the **uncommitted plant page work in the tree today** (23 modified files plus the untracked `config/plant-colors.ts`). **Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Background:** every page except home gets the plant page's background (cream `botanical.page`, `PaperGrain`, drifting flowers and leaves). Home keeps the photo slideshow, but its orange washes become warm cream washes | User |
| D2 | **Brand colours become botanical tokens, swapped once in `theme/colors.ts`:** `primary` → olive, `accent` → terracotta, `ink`/`inkMuted` → the plant page's ink and muted text, `surface` → cream, `page` → `botanical.page`, `border` → `botanical.line`. All ~300 existing `colors.*` uses follow without edits | User |
| D3 | **Surfaces:** cards, rows and sheets use cream, the 20px plant radius and the warm brown tile shadow. Pills stay fully round. The smaller radii (search results, form, read-time badge, per `docs/ideas/RESTUI.md`) map to smaller botanical steps, so their sizes relative to each other stay the same | User |
| D4 | **Serif titles:** page titles, section titles (`Section`), card titles (posts, blogs, plant cards) and plant names use `serif`. Section titles use the shared `sectionTitle` style | User |
| D5 | **One token file:** `config/plant-colors.ts` is renamed `config/botanical-theme.ts` and holds the palette, `radius`, the shadows and the background decorations. It keeps "no imports", so anything can use it. `theme/*` re-exports it, and components import from `@/theme` only. Direct `@/config/plant-colors` imports (13 files) move to `@/theme` | Default |
| D6 | **Shadow format:** one shadow, kept in two forms generated from the same numbers. `tileShadowStyle` (`shadowColor`/`elevation`, needed for Android under clipped cards) and a `boxShadow` string. `theme/effects.ts` `shadow.*` is rebuilt from the warm brown `#5a3a1a` instead of the green ink | Default |
| D7 | **Background scroll:** `BackgroundBlurProvider` (`lib/background-blur.tsx`) becomes `BackgroundMotionProvider` with two shared values, `blur` (as today) and `scrollY`. Pages that already have a scroll handler set `scrollY` (one line each), so the flowers drift. A page that doesn't set it gets still flowers | Default |
| D8 | **`PlantBackground` and `EdgeDrift`** move from `components/plants/` to `components/layout/botanical-background.tsx` (renamed `BotanicalBackground`). The plant page and the skeleton keep their own instance, fed by their scroll, and the shell uses it for every non-home page | Default |
| D9 | **Auth screens and the Expo template leftovers** (`constants/theme.ts`, `hooks/use-theme.ts`, `themed-text.tsx`, `themed-view.tsx`, `button.tsx`, `cookie-banner.tsx`, `google-button.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`) are in scope. `Colors.light` is mapped onto the botanical tokens. Dark mode is not themed: the app is light only (`theme/colors.ts`) | Default |
| D10 | **Error red and link blue** become tokens: `colors.danger` (a warm red that reads on cream, about 4.5:1) and `colors.link` (the blog link blue stays, since it marks links in texts). The hard-coded `#e5484d` and `#3c87f7` go | Default |
| D11 | **Photo overlays stay dark:** the black gradients on blog cards (`wiki/post-card.tsx`) and the search dimmer are for legibility over photos. They become `colors.overlay` tokens but keep their values | Default |
| D12 | **Tile tones (beige, pink, yellow) stay plant page only.** Other cards use plain cream (D3) | User (chose "Cream + plant radii/shadow") |
| D13 | **Out of scope:** `backend/` (incl. the admin), `packages/shared`, font loading (`typography.ts` `fontFamily` stays unused), layout, spacing, animations | User / Default |

## 1 — Risks and blockers

1. **Uncommitted work.** The plant page files this plan reads from (`plant-background.tsx`, `tile-card.tsx`, `plant-colors.ts`, …) are modified and not committed. Commit them first, so this plan's diff is reviewable on its own.
2. **Contrast.** Olive `#6c6a3a` on cream `#f7ebd8` is about 4.9:1, which is fine for text. White text on terracotta `#d6745f` is about 3.0:1, below 4.5:1 for normal text. Call-to-action buttons (`action-button.tsx`, `send-button.tsx`) must use `botanical.ink` text or a darker terracotta (`darker(terracotta, 0.2)`). Testing 2 checks every pair.
3. **Android shadows.** `boxShadow` needs RN ≥ 0.76 (already used across the app). The plant page uses `shadow*` props plus `elevation` on an outer, unclipped view. Where an existing card clips (`overflow: 'hidden'`) and uses `boxShadow`, check it on Android. Keep the outer/inner split only where it already exists, so structure doesn't change.
4. **Performance.** The drifting background is four animated SVGs plus the grain on every page. Lists (results, community, wiki) scroll above it. Check frame rate on a low-end Android. Fallback: `still` flowers (no `scrollY`) on list pages.
5. **The green wordmark.** `AppTitle`, the shell title and `PopInText` use `colors.primary` with a white outline. They become olive with a cream outline (`outlineColor` default `#ffffff` → `botanical.cream`).

## 2 — Approach

```
config/botanical-theme.ts   ← palette, TILE_TONES, radius, shadow numbers, DECORATIONS, grain   (no imports)
        │
theme/colors.ts      colors.* = botanical values (D2), + danger, overlay
theme/spacing.ts     radius = re-export of the botanical radius scale
theme/effects.ts     shadow.*, outline, backdrop, shade from the warm shadow (D6)
theme/botanical.ts   serif, sectionTitle, smallCaps, mixColor (as today)
theme/index.ts       export * (as today)
        │
components → '@/theme' only
        │
components/layout/botanical-background.tsx  (moved PlantBackground + EdgeDrift)
        ├── AppShell 'plain'  → <BotanicalBackground scrollY={motion.scrollY} />
        ├── plant page        → own instance (its scroll)
        └── page-skeleton     → still instance
```

Changing a token value in `config/botanical-theme.ts` changes the whole app.

## 3 — Token file: `config/botanical-theme.ts`

Renamed from `config/plant-colors.ts` (git mv), with additions:

- **Palette:** `botanical`, `sunColors`, `GRID_TILE_TONES`/`TILE_TONES`, `gridTileIndex`, `TILE_FLOWER_COLORS`, `artColors`, `tileGrain` as today.
- **`botanicalRadius`**, the scale taken from the plant page's literals:
  - `xs: 6`: tags, the read-time badge (today 6)
  - `sm: 10`: search results and their headers, small inputs (today `radius.xs` 8)
  - `md: 14`: buttons and fields, the carousel image (today `radius.sm` 12 and the carousel's 14)
  - `tile: 20`: cards, rows, blocks, tiles, description, ask card (today 16 and the plant page's 20)
  - `circle: 22`: icon circles (today 21/22)
  - `full: 9999`

  The keys in `theme/spacing.ts` `radius` stay (`xs/sm/md/full`) and point at the new steps (`xs→sm`, `sm→md`, `md→tile`), with `tile` and `circle` added. So the 82 existing `radius.*` uses need no edit (D3).
- **`warmShadow`**, `{ color: '#5a3a1a', … }` in three strengths. `tile` is today's `tileShadow` (0.18, y 3, r 8). `soft` is the chip/tab one (0.1–0.12, y 1, r 3). `lifted` is for sheets and the lightbox (stronger, larger). Each has a `…Style` object (shadow props + elevation) and a `…Css` string.
- **`BACKGROUND_DECORATIONS`**, the `DECORATIONS` list from `plant-background.tsx` with the constants `DRIFT`, `PATTERN`, `PUSH`, `SHOWN`. The title flower and the two photo header flowers (sizes 170/140, `turn ±0.06`) become `TITLE_FLOWER` and `HEADER_FLOWERS`.

`theme/botanical.ts` re-exports from the new path. `GRID_TILE_TONES` and the tones stay exported for the plant page only.

## 4 — Theme layer (`app/src/theme/`)

| File | Change |
|---|---|
| `colors.ts` | `colors` values from `botanical` (D2). New tokens: `danger`, `overlay` (black for photo gradients), `cream`. `formGray`/`quietGray` become `botanical.inkMuted` and `botanical.sand`. `alpha` stays |
| `spacing.ts` | `radius` re-points to `botanicalRadius` (§3). `Radius` type updated |
| `effects.ts` | `shadow.raised/card/small/tile/sheet/button` rebuilt from `warmShadow` Css strings. `outline` → `botanical.line`, `backdrop` → `alpha(botanical.ink, 0.3)`. New `shadowStyle` (the native-prop versions) for clipped cards |
| `botanical.ts` | Import path only. Add `pageTitle` (serif, 32/38) and `cardTitle` (serif, 20/24) next to `sectionTitle` (D4) |
| `constants/theme.ts` | `Colors.light` from the tokens. `Colors.dark` mirrors light (D9) |

## 5 — Background

- **New `components/layout/botanical-background.tsx`**, `PlantBackground` → `BotanicalBackground` and `EdgeDrift`, moved unchanged, reading `BACKGROUND_DECORATIONS`. `components/plants/plant-background.tsx` is deleted, and its three importers (`plants/[id]/index.tsx`, `photo-header.tsx`, `search/page-skeleton.tsx`) get the new path.
- **`lib/background-blur.tsx` → `lib/background-motion.tsx`**: the provider holds `{ blur, scrollY }`. `useBackgroundBlur` stays as a thin wrapper, so `app/(app)/index.tsx` and `background-slideshow.tsx` don't change. Add `useBackgroundScroll()`.
- **`layout/app-shell.tsx`**: `background === 'plain'` renders `<BotanicalBackground scrollY={scrollY} />`, and `root` uses `botanical.page`. The plant page still draws its own instance over it (unchanged behaviour).
- **`layout/background-slideshow.tsx`**: `PlainBackground` is deleted. The home `warm` wash uses `alpha(botanical.butter/cream, …)` instead of the orange.
- **Pages feeding `scrollY`** (one line in the existing scroll handler, or an `onScroll` on the existing list): `results.tsx`, `community/index.tsx`, `community/[id].tsx`, `wiki/index.tsx`, `wiki/[id].tsx`, `profile/index.tsx`. `profile/password.tsx` and `privacy.tsx` can stay still.
- **Auth screens** (`sign-in`, `sign-up`, `forgot-password`, `reset-password`, `privacy`) are outside `AppShell`. Each gets `<BotanicalBackground />` (still) as its first child, absolutely filled, so no layout changes.

## 6 — Components

Per file: swap literals for tokens and add serif titles (D4). No prop, layout or structure changes.

| Area | Files | What changes |
|---|---|---|
| Shared styles | `ui/styles.ts` | `raisedTile` and `card` use cream, `radius.tile`/`md`, warm shadow. Used by the bottom nav, the corner buttons and cards, so most of the app follows from here |
| UI kit | `ui/action-button`, `pill-button`, `icon-button`, `arrow-button`, `send-button`, `chip`, `checkbox`, `radio-button`, `text-field`, `message-input`, `category-tabs`, `bottom-sheet`, `text-panel`, `skeleton`, `range-slider`, `step-slider`, `collapsible`, `outlined-text`, `pop-in-text`, `glass-text`, `section` | Button text contrast (Risk 2). `category-tabs` `#000000` borders → `botanical.ink`. `action-button` inset glow from `butter`. `collapsible` radius 12 → `radius.md`. `outlined-text` default outline → cream. `Section` title → `sectionTitle` |
| Layout | `layout/bottom-nav`, `page-header`, `top-gradient` | Cream tiles and warm shadows. `top-gradient` fades from `botanical.page` |
| Search | `search/search-bar`, `search-results`, `result-row`, `page-search-bar`, `lens-preview`, `page-skeleton` | Dimmer → `colors.overlay`. Results on cream with `radius.sm` |
| Home | `home/ask-card`, `follow-us`, `paper-plane`, `social-icons`, `app-title` | `ask-card` `#d0d4d9` divider → `botanical.lineSoft`. Wordmark olive (Risk 5) |
| Results | `results/section-tools`, `section-filter-sheet`, `sun-range`, `filters/filters-button`, `plants/plant-card`, `plant-badge`, `months-pill`, `plant-picker` | Cards cream, radius `tile`. Plant card name in `cardTitle` |
| Community | `discussion/*` (5 files), `app/(app)/community/*` | `sort-menu` `#000000` → ink. `quietGray` gaps follow the token |
| Wiki | `wiki/post-card`, `post-carousel`, `read-time-badge`, `comments-section`, `share-buttons`, `rich-text` | Overlay gradients → `colors.overlay` (same values, D11). Badge radius → `radius.xs`. Post titles in `cardTitle` |
| Explore / profile | `explore/explore-sheet`, `app/(app)/profile/*` | Tokens and page titles |
| Template leftovers | `themed-text`, `themed-view`, `button`, `cookie-banner`, `google-button`, `hint-row`, `web-badge`, `animated-icon` | `#3c87f7` → `colors.link`, `#e5484d` → `colors.danger`. `animated-icon` `#208AEF` and radius 40 → terracotta and `radius.full` (check where it shows first) |
| Motion | `motion/light-up-text` | `GLOW` `#f6c453` → `botanical.butter` |
| Plant page | `components/plants/*` (incl. `lifecycle/*`, `tile-art/*`), `plants/[id]/index.tsx` | No visual change. Literal radii (20, 21, 22, 18, 14, 4, 999) → `radius.*`. Inline shadows in `chip-row` and `tab-buttons` → `warmShadow.soft`. Imports from `@/theme` |

## Testing

No network calls.

1. **Leftover literals:** grep for hex colours, `rgba(`, `borderRadius: <number>`, `shadowColor` and `elevation:` under `app/src/{app,components,lib}`. Expected hits: only `config/botanical-theme.ts`, `components/ui/flower-shapes.tsx` (drawing colours) and `tile-art/*` (art colours from `artColors`). Also grep that `@/config/plant-colors` and `plant-background` have no importers.
2. **Contrast script** (scratch Node script, outside the repo): compute WCAG ratios for every text/background pair in the tokens: ink, inkMuted, primary, danger and link on cream and page, and button text on terracotta and olive. All ≥ 4.5:1 for body text and ≥ 3:1 for large text and icons.
3. **Typecheck and lint:** `npx tsc --noEmit` and `npx expo lint` from `app/` (AGENTS.md).
4. **Visual pass on a device and the web (user-run):** each route in `app/src/app/` before and after. Check that positions and sizes are unchanged (screenshots side by side), the flowers drift on scrolling pages, home still shows photos, and Android shadows show under cards (Risk 3). Limit: animations and contrast-in-sunlight can't be checked from code.

## Task list

| # | Task | Files |
|---|---|---|
| 0 | Commit the current plant page work (user) | — |
| 1 | Rename the token file. Add radius scale, warm shadows, decorations | `config/plant-colors.ts` → `config/botanical-theme.ts` |
| 2 | Theme layer on the tokens. Add `danger`, `overlay`, `pageTitle`, `cardTitle` | `theme/colors.ts`, `spacing.ts`, `effects.ts`, `botanical.ts`, `constants/theme.ts` |
| 3 | Plant page onto tokens (imports, literal radii, inline shadows), with no visual change | `components/plants/**`, `plants/[id]/index.tsx` |
| 4 | Contrast script (Testing 2). Adjust button text tokens if needed | scratch |
| 5 | Move the background. Motion provider with `scrollY` | `layout/botanical-background.tsx`, `lib/background-motion.tsx`, `plant-background.tsx` (delete) |
| 6 | Shell and home backgrounds | `layout/app-shell.tsx`, `layout/background-slideshow.tsx` |
| 7 | Feed `scrollY` from list pages. Still background on auth screens | `app/(app)/{results,community/*,wiki/*,profile/index}.tsx`, auth screens |
| 8 | Shared styles and UI kit | `components/ui/*` |
| 9 | Layout, search, home | `components/{layout,search,home}/*`, `ui/app-title.tsx` |
| 10 | Results, community, wiki, explore, profile | `components/{results,filters,discussion,wiki,explore}/*`, `plants/plant-card*` |
| 11 | Template leftovers, motion | `themed-*`, `button`, `cookie-banner`, `google-button`, `hint-row`, `web-badge`, `animated-icon`, `motion/light-up-text` |
| 12 | Serif titles (D4) | `ui/section.tsx`, page title styles, card titles |
| 13 | Testing 1 and 3. Device pass (Testing 4) | — |

Files **not** touched: `backend/` (incl. the admin dashboard), `packages/shared`, `app.json`, `android/`, `config/` other than the token file, all layouts, spacing (`space`, `size`) and animations.

## Open items

1. **Home wash colour (D1):** a cream wash or a light butter-yellow wash over the photos. The plan uses cream; easy to change in one token.
2. **Danger red value (D10):** proposed `#b5462f` (terracotta family, about 5:1 on cream). Confirm or give a value.
