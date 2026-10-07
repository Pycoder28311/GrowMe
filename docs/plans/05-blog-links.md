# 05 — Blog links inside texts

**Goal:**
- In the dashboard, select words in any body text and link them to an existing blog, picked from a
  searchable list. This works in plain text boxes and in the Tiptap editor.
- The link lives inside the text itself (`[λέξη](blog:12)`), so there is no link table.
- The app hides the markup and shows the words in light blue. A tap slides up a panel with the blog's
  title, the start of its text and «Δες περισσότερα».

**Depends on:** plan 04 (tips library, text traits) and the blog `kind` change. **Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Body texts only** take links (the list is under "Fields" below). Titles and names stay plain, and so do the disease label and the blog kind | User |
| D2 | A tap opens a **bottom panel preview**: the blog's title, the start of its text, «Δες περισσότερα» → `/wiki/:id` | User |
| D3 | Plain-text syntax is **`[visible words](blog:12)`**. In Tiptap it's a normal link mark whose `href` is `blog:12` | User |
| D4 | Deleting a linked blog: the delete confirmation **says how many texts link to it**. Afterwards the app shows those words as plain text | User |
| D5 | The text is turned into links **in the app**, not on the server. The API returns the raw text; the server only checks on save that every linked blog exists | Default |
| D6 | One shared parser in `packages/shared` (`blog-links.ts`), used by the app, the dashboard script and the server checks | Default |
| D7 | Only blog links turn light blue. Web links in articles stay green and underlined, as today | Default |
| D8 | Places where the whole thing is already one tap target (plant cards, results) show the **visible words only**, not links | Default |
| D9 | Text limits count the **visible** characters. The raw text may be longer (traits: 60 visible, 400 raw) | Default |
| D10 | Only the dashboard forms check links. The admin-only public write routes (`POST /api/plants`, `/api/tips`, …) aren't used by the app and stay as they are | Default |
| D11 | The blog list for the picker is loaded once per form page (like tips in plan 04), and search happens in the browser | Default |
| D12 | A blog can't link to itself (it's left out of its own picker) | Default |

**Fields that take links (D1):**
- **Plant:** `description`, `food`, `seeds`, `native`, each lifecycle's `content`, each new tip's
  `content`, each disease's `content`.
- **Tip (its own page):** `content`.
- **Combination:** `description`.
- **Blog:** `content` (Tiptap).

## 1 — Risks and blockers

1. **Old app builds show the raw markup.** A phone on the current build would show
   `[στάγδην άρδευση](blog:12)` as written. Ship the new build before adding links to real content.
2. **Broken links.** Nothing stops a linked blog from being deleted (D4 only warns). The app finds out
   only when the panel loads (404) and then shows «Το άρθρο δεν είναι πια διαθέσιμο». The word stays
   blue until it's tapped.
3. **Tiptap's link extension rejects unknown protocols.** `blog:` must be added to its `protocols` /
   `isAllowedUri`. The shared `richDoc` href check (`/^(https?:\/\/|mailto:)/`) must also allow
   `^blog:\d+$`.
4. Remote migrations 0007–0011 come first, as for the earlier plans (no new migration here).

## 2 — Architecture

```
Dashboard (write)                         Database                 App (read)
textarea/input  ─select words─▶ picker ─▶ "… [λέξη](blog:12) …" ─▶ parseBlogLinks() ─▶ <LinkedText>
Tiptap          ─🔗 → «Άρθρο» ─▶ picker ─▶ {"type":"link","attrs":{"href":"blog:12"}} ─▶ <RichText>
                                                                             tap ─▶ BlogPreview panel
save ─▶ assertBlogLinks(): every id exists (400 at the field's path otherwise)
```

## 3 — Shared (`packages/shared/src/blog-links.ts`, exported from `index.ts`)

- `BLOG_LINK = /\[([^\[\]\n]{1,200})\]\(blog:(\d{1,9})\)/g`
- `parseBlogLinks(text): ({ text: string } | { text: string; blogId: number })[]` returns the text in
  segments, in order.
- `stripBlogLinks(text): string` returns the visible words only (cards, accessibility labels, snippets).
- `blogLinkIds(text): number[]` returns the unique ids.
- `visibleLength(text): number` gives the length used by D9.
- `linkableText(max, rawMax)` is a zod helper: trim, `rawMax` on the raw text, and a refine on
  `visibleLength`. It's used in `plants.ts` for `text` / `trait` and in `combinationSave.description`.
  Messages stay the existing «Too big…» ones.
- `rich-text.ts`:
  - The `href` regex allows `^blog:\d+$`.
  - New `richBlogLinkIds(doc)` walks the link marks.
  - `plainTextOf` already drops marks, so snippets need no change.

## 4 — Backend

- **Link check:** new `backend/src/resources/blogs/blog-links.ts` with
  `assertBlogLinks(db, entries: { path: string; ids: number[] }[])`.
  - One `inArray` query for all ids.
  - Each missing one gives 400 `UNKNOWN_REFERENCE` at its field path, e.g. `lifecycles.2.content`,
    with the message `Unknown blog link`.
- **Called from:**
  - `savePlant`: description, the three traits, lifecycles, new tips, diseases.
  - `tipsAdmin.edit.save`, `saveCombination`, `saveBlog` (with `richBlogLinkIds`, and its own id
    rejected per D12).
- **Delete warning (D4):**
  - `linkedFromCount(db, blogId)` counts the texts containing `](blog:N)` (plants, lifecycles, tips,
    diseases, combinations) plus blogs whose JSON contains `"href":"blog:N"`. It's one `SELECT` of
    `LIKE` sums: fine for a dashboard action.
  - `AdminEdit` gets an optional `deleteConfirm(item)` and `FormPage` passes it as `data-confirm` on
    its Delete button. `admin.client.js` already calls `confirm()`, so only the text changes.
  - The blog form's `get` adds `linkedFrom`, giving the message «Το άρθρο έχει συνδέσμους από N
    κείμενα· θα γίνουν απλό κείμενο. Να διαγραφεί;».
- **Picker options:** the forms that take links render
  `SearchOptions source="blogs"` (`ui/search-select.tsx`) with `{ value: id, label: name, hint: kind
  label · date }`. This is added to `options` in plants, tips, combinations and blogs (minus itself).

## 5 — Dashboard UI

- **Fields:** `TextArea`, `TextField` and `SuggestField` get a `blogLinks` prop, which adds
  `data-blog-links`. It's set on the fields in D1.
- **Plain-text linking** (`admin.client.js`, new section):
  - Selecting text in a `[data-blog-links]` field shows a small floating pill «🔗 Σύνδεσμος σε άρθρο»
    above the field. It reacts to `select`, `mouseup` and `keyup` and reads `selectionStart/End`.
  - With the cursor inside an existing `[…](blog:N)`, the pill shows «Αλλαγή» / «Αφαίρεση συνδέσμου».
    Removing a link keeps the words.
  - The pill opens one page-level `<dialog>` (`ui/blog-link-dialog.tsx`, rendered by `FormPage` when
    the page has blog options). The dialog has a search box and results, using the same filtering as
    `SearchSelect` (accent-insensitive), and «Αφαίρεση» when editing.
  - Picking replaces the selection with `[selection](blog:id)` and fires `input`, so `dirty` and error
    clearing work.
  - Refused: selections with `[`, `]` or a line break, and selections that overlap another link.
  - Under each linked field, a muted line lists its links («λέξη → Τίτλος άρθρου») so the raw markup
    is readable.
- **Tiptap** (`backend/admin-editor/editor.ts` + `ui/rich-text-editor.tsx`):
  - The link dialog gets two tabs, «Ιστοσελίδα» (today's URL field) and «Άρθρο» (the same blog search).
  - Saving sets the link mark with `href: blog:<id>`.
  - Link extension: `protocols: ['blog']`, and `isAllowedUri` lets `blog:\d+` through.
  - Clicking a blog link in the editor opens `/blogs/:id` in a new tab (the current `handleClick`
    opens web links).
  - The CSS rule `.ProseMirror a[href^="blog:"]` makes blog links light blue in the editor too.
  - Rebuild with `npm run build:admin`.
- **Styles** (`ui/styles.ts`): the pill, the dialog list (reuses `.search-results`), the links line
  under fields, and a `--link` token for the blue.
- **Greek messages:** `Unknown blog link` → «Ο σύνδεσμος δείχνει σε άρθρο που δεν υπάρχει».

## 6 — App

- **Theme:** `colors.link`, a light blue with at least 4.5:1 contrast on white (e.g. around
  `#1E73D8`; check it with the contrast tool before choosing).
- **`components/ui/linked-text.tsx`:** `<LinkedText {...AppTextProps}>{raw}</LinkedText>` renders
  `parseBlogLinks` as one `AppText` with nested `Text` links (`accessibilityRole="link"`, colour
  `colors.link`, `onPress` → `openBlogPreview(id)`).
- **`lib/blog-preview.tsx`:**
  - `BlogPreviewProvider` sits in `app/(app)/_layout.tsx` and holds one `BottomSheet` (existing
    `components/ui/bottom-sheet.tsx`, `initialSnap="half"`). `useBlogPreview().open(id)` opens it.
  - Blogs are fetched with `blogsApi.get` and cached in a `Map` for the session.
  - The panel shows the title, the first ~160 characters of `plainTextOf(parseRichContent(content))`
    and «Δες περισσότερα» → `router.push('/wiki/[id]')`, which closes the panel first.
  - It also has loading and error states, and a 404 gives «Το άρθρο δεν είναι πια διαθέσιμο».
- **Uses:**
  - Plant page `app/(app)/plants/[id].tsx`: description, tips content, disease content.
  - `components/plants/life-cycle-card.tsx`: stage content.
  - `components/plants/plant-facts.tsx`: fact rows and pills (`Trait.label` becomes raw text rendered
    with `LinkedText`).
  - `components/plants/plant-card.tsx`: `stripBlogLinks` (D8).
  - `components/wiki/rich-text.tsx`: a link mark with `blog:` gets `colors.link`, no underline, and
    opens the preview. Web links stay as they are.
- `config/plant-traits.ts`: emoji choices compare against `stripBlogLinks(seeds)` (e.g. «Από φυτό» →
  🪴).

## Testing

- **Shared unit checks** (scratch script): parse, strip, ids, visible length, overlapping/malformed
  markup left as text, and Greek text with accents.
- **Backend E2E** (fake Access, like plan 04):
  - a plant with links in every D1 field saves
  - an unknown id → 400 at the exact path (`diseases.1.content`, `food`, …)
  - Tiptap `blog:` href accepted, a self-link refused
  - a trait of 60 visible characters but longer raw text → OK, 61 visible → 400
  - the delete confirmation count
- **Dashboard browser test (Playwright):**
  - select a word in a textarea, link it, change it, remove it
  - the same in a `SuggestField` and in a new list row
  - the Tiptap «Άρθρο» tab
  - the links line under fields
  - no console or CSP errors
- **App on web:**
  - blue words on the plant page (description, lifecycle, tip, disease, fact pill) and in an article
  - a tap opens the panel with the title and snippet, and «Δες περισσότερα» opens the article
  - a deleted blog shows the "no longer available" message
  - cards show plain words
  - typecheck and lint

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Shared parser, helpers, zod `linkableText`, `blog:` hrefs | `packages/shared/src/blog-links.ts`, `rich-text.ts`, `plants.ts`, `index.ts` |
| 2 | `assertBlogLinks` + calls in the four saves | `backend/src/resources/blogs/blog-links.ts`, `admin/plants/plants.save.ts`, `admin/tips/tips.admin.tsx`, `admin/combinations/combinations.save.ts`, `admin/blogs/blogs.save.ts` |
| 3 | Blog options in the forms; `blogLinks` on fields | `admin/ui/fields.tsx`, the four `*.admin.tsx` |
| 4 | Link dialog + plain-text linking + links line | `admin/ui/blog-link-dialog.tsx`, `admin/ui/pages.tsx`, `admin/admin.client.js`, `admin/ui/styles.ts` |
| 5 | Tiptap «Άρθρο» tab, `blog:` protocol, blue style; rebuild | `backend/admin-editor/editor.ts`, `admin/ui/rich-text-editor.tsx` |
| 6 | Delete warning count | `blogs/blog-links.ts`, `admin/resource.tsx`, `admin/ui/pages.tsx`, `admin/blogs/blogs.admin.tsx` |
| 7 | App: colour token, `LinkedText`, preview provider + panel | `app/src/theme/*`, `components/ui/linked-text.tsx`, `lib/blog-preview.tsx`, `app/(app)/_layout.tsx` |
| 8 | App: use it on the plant page, facts, lifecycle card, rich text; strip on cards | listed in §6 |
| 9 | Tests + a docs line | scratchpad, `instructions/adding-a-resource.md` |
| 10 | **With approval:** deploy, commit/push, new app build (before using links in content) | — |

Files **not** touched: the database schema and migrations (none needed), titles/names and the disease
label (D1), community posts and comments, users' notes.

## Open items

- Should links later also work in community posts or blog comments written by users? Not in this plan.
- If you later want a "which texts link here" page per blog, it can reuse `linkedFromCount`'s query.
