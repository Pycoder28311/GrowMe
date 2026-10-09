# 13 — Question form, message inputs, posts, blog page, result cards

**Goal:**
- **Question form (home):**
  - a paper-plane send button: on send, the text and photos fly into it on white cards and it flies off to the top right; a new plane takes its place and the field says «Επόμενη ερώτηση…»
  - a gray photo button like an email form's
  - bigger, better-aligned controls; a stronger divider between title and question
  - a gray focus border with more padding
  - «Δες όλες τις αναρτήσεις» as wide as the form, both with the same smaller corners
- **Message inputs** (post replies, blog comments, new posts):
  - no orange focus border
  - a shared «Αποστολή ›» button
  - the text wraps onto new lines and the button stays on the last line
- **Posts:**
  - full width with no corners
  - the actions scale with the photo
- **One post's page:**
  - full width
  - a gray gap between the post and its replies
  - the bottom field answers the post
  - replies show no date
- **Blog page:**
  - kind tabs that really filter, in a hidden-scrollbar row
  - new card style
  - light-gray minutes badge
  - the search shows articles first there
- **Result cards:**
  - no wind
  - the months pill cycles through its ranges
  - icons instead of emoji
- **Filters button:** «Φίλτρα» ⇄ «Υποβολή» flips vertically.

**Depends on:** plan 12 (search results, radius.xs).
**Not in this plan:** a "seed" element on the result cards (you said to leave it).

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Send button of the question form:** a round button with the common **paper-plane icon** (`send` → `paperplane` / `send`), no text | User |
| D2 | **Sending animation** (~1.4 s), once the post is created: <br>1. the question text and each photo get a **plain white card** behind them (radius.xs, soft shadow) <br>2. they **shrink and move into the plane** (staggered by 60 ms), fading as they arrive <br>3. the plane **turns 30° up-right and flies off the top right** of the form, fading <br>4. a **new plane pops in** at its place <br>5. the emptied field's placeholder becomes **«Επόμενη ερώτηση…»** <br>With Reduce Motion: the fields just clear and the placeholder changes | User |
| D3 | **On error** nothing flies: the text stays, and the error shows under the form as today | Default |
| D4 | **Photo button:** **gray**, like an email form's attach button (`#5f6368` icon and text on transparent, light-gray background on press), **bigger** (icon 24, normal-size text) and vertically centred with the send button | User |
| D5 | **Corners:** the form card and «Δες όλες τις αναρτήσεις» both use **radius.xs (8)**, smaller than the bottom buttons (12). «Δες όλες τις αναρτήσεις» is **as wide as the form** | User |
| D6 | **Focus border:** inputs get **no orange outline** (the browser's default on Android/web). On focus, a **1 px gray border** in the same gray as the photo button. Padding inside the inputs: **16 px sideways, 8 px up/down** | User |
| D7 | **Divider between title and question:** a stronger line (**2 px**, `#d0d4d9`) instead of today's faint 1 px | User |
| D8 | **Shared send button** (`components/ui/send-button.tsx`): «**Αποστολή**» with a **tailless right arrow** (`chevronRight`) after it. MessageInput (post replies, blog comments, the bottom composer) uses it. The question form keeps its paper plane (D1) | User |
| D9 | **Message inputs** (`MessageInput`): **no orange focus border** (D6 style). The field is **multiline and grows** with the text up to 5 lines, then scrolls. The send button sits at the **bottom right, aligned with the last line** | User |
| D10 | **Posts list:** each post is **full width, no corners** (only a thin separator between posts) | User |
| D11 | **Actions scale with the photo:** a post with photos shows its actions (Απαντήσεις, like, dislike) at **normal size** (icon 20, text normal); a text-only post keeps them **small** (icon 16, small text) | User |
| D12 | **One post's page:** <br>• the post is full width, no corners <br>• a **gray gap** (12 px, `#eceef0`) between the post and its replies <br>• the **bottom field answers the post** (placeholder «Γράψε απάντηση…»): the in-card reply field and the «new post» bottom field go | User |
| D13 | **Replies show no date** (post replies; blog comments too, as they share the component) | User |
| D14 | **Blog tabs:** «Όλα · Άρθρα · Γλωσσάρι · Μπαλκόνια» (kinds `article`, `glossary`, `balcony`). Kind `wiki` gets no tab; it shows under «Όλα» only. The tabs **filter for real**: a new optional `?kind=` on `GET /api/blogs` (the API can't filter by kind yet). Shown as a **horizontally scrolling row** with **no visible scrollbar**, pills light gray (active: dark text on a slightly darker gray) | User |
| D15 | **Blog cards** (all but balcony): <br>• a **black gradient from the bottom to the middle**, low opacity (0 → 55%) <br>• a **bigger title** (28 px) <br>• «Δες περισσότερα ›» **bottom right** <br>Balcony cards stay as they are | User |
| D16 | **Minutes badge** (card and article page): **small corners (6 px), light gray** (`#eceef0`), **no border** | User |
| D17 | **Search on the blog pages** (`/wiki`, `/wiki/[id]`): **«Άρθρα» first, «Φυτά» after**. Elsewhere plants stay first | User |
| D18 | **Result cards: no wind.** The card shows no wind information. (Today it doesn't either: checked. This plan keeps it that way and makes sure the new icons don't bring it back) | User |
| D19 | **Months pill on the card's photo:** <br>• one range: as today <br>• **two ranges: they swap every 2 s** (cross-fade, back and forth) <br>• **three: a little carousel** (each slides in from the right every 2 s) <br>It **no longer shows the season emoji** (no sun) | User |
| D20 | **The three fields on the card** (sun, difficulty, edible) get **real icons** (`sun`, `gauge`, `food` from `icon.tsx`, small, muted) instead of emoji. The origin line gets the `location` icon | User |
| D21 | **Filters button:** switching «Φίλτρα» ⇄ «Υποβολή» **flips the label vertically** (rotateX 0 → 90° out, the new one −90° → 0 in, 300 ms in all) instead of fading | User |

## 1 — Risks and blockers

1. **The flying animation needs positions:** each piece (text, photo thumbnails) is measured (`measureInWindow`) and copied into an overlay over the form. The real inputs clear at once under it, so nothing jumps.
2. **Growing inputs on web:** react-native-web's multiline `TextInput` doesn't grow by itself; the height comes from `onContentSizeChange` (works on web and phones), clamped to 5 lines.
3. **The focus outline on web** is removed with `outlineStyle: 'none'` (web-only style) and replaced by the gray border. Keyboard users still see the border change.
4. **Blog filter by kind:** the API has no kind filter yet. It gets a small one, the same way plants filter by combination (`blogFilter` in shared, `filter` in the crud routes, a `where` in `blogsRepo.list`). The app's paged list needs one list per tab (reset on tab change).
5. **The months carousel** runs a timer per visible card; it pauses when the card leaves the screen (`FlatList` `onViewableItemsChanged`) to save work in long lists.

## 2 — Question form (`components/home/ask-card.tsx`)

- **Layout:**
  - the card: `radius.xs`, padding `space.md`
  - the title input, the 2 px divider (D7), then the question
  - the photo thumbnails
  - the footer row: photo button left, paper plane right, both 48 px tall and vertically centred
- **Inputs:** `paddingHorizontal: 16`, `paddingVertical: 8`, `borderWidth: 1`, `borderColor: transparent` → gray (`#5f6368` at 50%) while focused, `radius.xs`, and on web `outlineStyle: 'none'`.
- **Photo button:** `photo` icon 24 + «Φωτογραφία» (normal size), `#5f6368`, a pressed background `#eceef0`, `radius.xs`.
- **Paper plane** (`components/home/paper-plane.tsx`):
  - a round 48 px button, `colors.primary`, white `send` icon (new icon name `paperplane`: iOS `paperplane.fill`, Material `send`)
  - `fly()` runs the plane's flight (rotate to −30°, translate up-right ~120 px, fade, 450 ms), then a new plane pops in (scale 0.6 → 1, 250 ms)
- **Sending (`send()`):** after `postsApi.create` succeeds:
  1. measure the question box and each thumbnail
  2. put copies (text in a white card, each photo in a white card) in an absolute overlay inside the card
  3. clear the real fields
  4. animate the copies to the plane's centre (scale → 0.1, opacity → 0; 500 ms, staggered)
  5. `fly()` the plane
  6. set the placeholder to «Επόμενη ερώτηση…»
  The «Η ερώτησή σου δημοσιεύτηκε. Δες την ›» link stays under the form.
- **«Δες όλες τις αναρτήσεις»:** a full-width button under the form, white with a thin border, `radius.xs`.

## 3 — Message inputs and the send button

- **`components/ui/send-button.tsx`:** `SendButton({ onPress, disabled })`: «Αποστολή» bold + `chevronRight` (no tail), `colors.primary` background, white text, `radius.xs`, 36 px tall; dims when disabled.
- **`components/ui/message-input.tsx`:**
  - `flexDirection: 'row'`, `alignItems: 'flex-end'` (the button follows the last line)
  - border `colors.border` → the gray on focus, no outline (D6), `radius.xs`
  - `TextInput multiline`, height from `onContentSizeChange` (min one line, max 5 lines, then it scrolls)
  - `paddingHorizontal: 16`, `paddingVertical: 8`
  - Enter sends on web (Shift+Enter makes a new line); phones send with the button
- `BottomComposer`, `ReplyNode`'s answer box and the blog comments keep using `MessageInput`, so they all change at once.

## 4 — Posts

- **`app/(app)/community/index.tsx`:**
  - the list has no side padding
  - each post: white, no corners, `padding: space.md`, a 1 px `colors.border` line between posts (instead of 8 px gaps)
- **`components/discussion/discussion-item.tsx`:**
  - `date` becomes optional (not shown when absent)
  - a new `size: 'small' | 'normal'` for the actions (icon and text size)
- **The list** passes `size={item.images.length ? 'normal' : 'small'}`; the post page does the same for the post.
- **`components/discussion/post-photos.tsx`:** a single photo full width (no corners when the post is full width), several side by side as today.
- **`app/(app)/community/[id].tsx`:**
  - full width, no corners
  - a gray gap view (12 px, `#eceef0`) between the post and the replies
  - the in-card `MessageInput` goes; `BottomComposer` sends **a reply to the post** (`reply`, placeholder «Γράψε απάντηση…»)
  - the «new post» function goes from this page
- **`components/discussion/reply-thread.tsx`:** `ReplyNode` no longer passes a date.

## 5 — Blog page

- **Tabs (`config/wiki-posts.ts`):** `WIKI_TABS = [{ id: 'all', label: 'Όλα' }, { id: 'article', label: 'Άρθρα' }, { id: 'glossary', label: 'Γλωσσάρι' }, { id: 'balcony', label: 'Μπαλκόνια' }]`.
- **`components/ui/category-tabs.tsx`:**
  - a new `scroll` variant: a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}` (and on web `scrollbarWidth: 'none'`)
  - pills sized to their text, light gray `#eceef0`
  - active: `#d9dde2` with bold ink
  - `radius.xs`
  - the results page's tabs keep the equal-width variant
- **Filtering:**
  - backend: `blogFilter = z.object({ kind: z.enum(BLOG_KINDS).optional() })` in `packages/shared/src/blogs.ts`; `blogs.routes.ts` passes it as the list filter (like `plantFilter`); `blogsRepo.list(ctx, page, { kind })` adds `eq(blogs.kind, kind)` to the `where`
  - `api/blogs.ts` `list(cursor, kind?)`
  - `lib/blogs.ts` `useBlogs(kind?)`: the paged list keyed by kind, so a tab change starts again from the first page
  - `wiki/index.tsx` passes the tab's kind (`undefined` for «Όλα»)
- **`components/wiki/post-card.tsx`** (non-balcony):
  - shade: `linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%)`
  - the title in 28 px bold white
  - the bottom area a row: the title on the left (flex 1), «Δες περισσότερα ›» on the right, aligned to the bottom
- **`components/wiki/read-time-badge.tsx`:** radius 6, background `#eceef0`, no border; same on the card and the article page.
- **Search order (`components/search/search-results.tsx`):** a new `blogsFirst` prop; `TopCorners` sets it when `usePathname()` starts with `/wiki`. Both lists keep their headers; «Άρθρα» moves above «Φυτά», with the same gaps (plan 12 D8).

## 6 — Result cards and the filters button

- **`components/plants/plant-card.tsx`:**
  - **Fields:** the three fields become `Icon` + text (`FACT_ICONS.sun`, `.difficulty`, `FLAG_ICONS.food`; 14 px, `colors.inkMuted`). The origin line gets the `location` icon. `Trait.emoji` stays for anything else that uses it.
  - **No wind:** nothing on the card reads `wind` (checked).
  - **Months pill:** a new `MonthsPill({ ranges })` (`components/plants/months-pill.tsx`):
    - labels from `plantingPeriod(range).label` (no emoji)
    - two ranges: an opacity swap every 2 s
    - three: a horizontal slide, one after the other, looping, every 2 s
    - paused while off screen (`active` prop from the list's viewable items) and with Reduce Motion (shows the first)
- **`app/(app)/results.tsx`:** `onViewableItemsChanged` keeps the visible card ids, passed as `active` to the cards.
- **`components/filters/filters-button.tsx`:** the label is in a `FlipLabel`:
  - when `submit` changes, the old label turns 90° on X (150 ms) and the new one turns in from −90° (150 ms)
  - with Reduce Motion it just swaps
  - the badge flips with «Φίλτρα»

## Testing

Expo web + Playwright with the mocked API (plans 10–12), plus a phone.

| Area | Checks |
|---|---|
| Question form | Gray photo button; 2 px divider; gray focus border and 16/8 padding, no orange outline; send → text and photos fly into the plane on white cards, the plane flies off, a new one appears, placeholder «Επόμενη ερώτηση…»; on a failed send nothing flies; «Δες όλες τις αναρτήσεις» as wide as the form, same corners |
| Message inputs | No orange outline; «Αποστολή ›» button; long text wraps and the field grows to 5 lines; the button stays at the last line; Enter sends on web, Shift+Enter breaks the line |
| Posts | Full width, no corners, separators; bigger actions on posts with photos; on the post page the bottom field replies to the post; gray gap; replies without dates |
| Blog page | Tabs Όλα/Άρθρα/Γλωσσάρι/Μπαλκόνια filter the list; no scrollbar shown; cards with the bottom gradient, bigger title, «Δες περισσότερα» bottom right; minutes badge light gray, small corners, no border; on /wiki the search shows «Άρθρα» first |
| Result cards | Icons instead of emoji; no wind; months pill: 1 range still, 2 swap every 2 s, 3 slide; no sun in the pill |
| Filters button | Flips vertically between «Φίλτρα» and «Υποβολή» |
| Checks | `npx tsc --noEmit`, `npx expo lint` (app), `tsc` (backend, shared) |

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `paperplane` icon; paper plane button and flight | `components/ui/icon.tsx`, `components/home/paper-plane.tsx` |
| 2 | Question form: layout, inputs, photo button, sending animation, «Δες όλες» | `components/home/ask-card.tsx` |
| 3 | `SendButton`; `MessageInput` multiline, focus border | `components/ui/send-button.tsx`, `components/ui/message-input.tsx` |
| 4 | Posts list full width; actions size; optional date | `app/(app)/community/index.tsx`, `components/discussion/discussion-item.tsx`, `post-photos.tsx` |
| 5 | Post page: full width, gap, reply composer, no reply dates | `app/(app)/community/[id].tsx`, `components/discussion/reply-thread.tsx` |
| 6 | Blog tabs (scroll variant) and filtering by kind (API + app) | `packages/shared/src/blogs.ts`, `backend/src/resources/blogs/blogs.routes.ts`, `blogs.repo.ts`, `config/wiki-posts.ts`, `components/ui/category-tabs.tsx`, `api/blogs.ts`, `lib/blogs.ts`, `app/(app)/wiki/index.tsx` |
| 7 | Blog card style; minutes badge | `components/wiki/post-card.tsx`, `read-time-badge.tsx` |
| 8 | Search: articles first on blog pages | `components/search/search-results.tsx`, `search-bar.tsx` |
| 9 | Result card icons, months pill | `components/plants/plant-card.tsx`, `months-pill.tsx`, `app/(app)/results.tsx` |
| 10 | Filters button flip | `components/filters/filters-button.tsx` |
| 11 | Tests (web + phone), typecheck, lint | scratchpad |
| 12 | **With approval:** commit, deploy the backend (blog filter), new app build | — |

**Files not touched:** the database (no migration), the dashboard, the plant page.

## Open items

- **The `wiki` kind** has no tab now; existing wiki blogs show only under «Όλα». Say if they should move to another kind in the dashboard.
- **Blog comments** lose their dates too (they share the reply component). Say if only post replies should lose them.
- **Colours** (gray `#5f6368` for the photo button and focus border, tab grays) are proposals.

## As built

Implemented; differences from the text above:
- **Blog cards:** «Δες περισσότερα» sits on its own line under the title, at the bottom right. With a 28 px title, a long Greek word left no room for it on the title's line.
- **Months pill:** the timer runs on every card (one 2-second timer each). Pausing cards that are off screen wasn't needed in tests, so `results.tsx` doesn't track visible cards. The pill takes the width of its widest range, so no label is cut.
- **Colours** `formGray` (#5f6368) and `quietGray` (#eceef0) are now theme tokens.
- **Checked** on Expo web (Playwright, mocked API):
  - **Question form:** gray focus border, gray photo button; on send, the text flies into the plane on a white card, the plane leaves and comes back, and the placeholder becomes «Επόμενη ερώτηση…»
  - **Posts:** full-width posts with bigger actions on the one with a photo; the post page with the gray gap, replies without dates, and the bottom field replying; a long reply wraps and grows with the button on its last line
  - **Blogs:** tabs request `?kind=glossary`; cards in the new style with the light-gray minutes badge; on the blog page the search shows «Άρθρα» first
  - **Results:** icons on the cards; the months pill swaps (2 ranges) and slides (3); the filters button flips
- Not yet checked on a phone.
