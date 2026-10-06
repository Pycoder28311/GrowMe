# 03 — Community posts: ask from home, list, likes, nested replies

**Goal:** a signed-in user asks a question from the home page card (optional title, text, up to 4
photos). It is saved as a **post** through the existing API. Below the card, **«Δες όλες τις
αναρτήσεις»** opens the Messages tab, which then shows the real posts from the database instead of the
in-memory examples. On the list and on each post you can **like / dislike** (posts and replies) and
**comment**. Comments can be answered, Reddit-style, and **«Απαντήσεις (n)»** under a comment loads its
answers.

**Depends on:** plan 01 (crud, shared package, likes, pagination), and remote migrations 0005–0007.
**Blocks:** nothing.

## 0 — Decisions

| # | Decision | Source |
|---|---|---|
| D1 | The home card keeps one question box. **Tapping into the question box reveals a «Τίτλος (προαιρετικός)» input above it.** An empty title becomes the question's first sentence (max 120 chars, cut at a word with «…») | User |
| D2 | Nested replies: migration **0008** adds `post_replies.parent_reply_id` (cascade) plus an index. Same model as `blog_comments` | User |
| D3 | Like / dislike on **posts and replies**, with the existing `/api/likes` routes and their rules (below) | User |
| D4 | Photos on **posts only**, up to 4, uploaded with the existing `POST /api/images`. Replies are text only | User |
| D5 | Only existing routes are used, plus small additions to them: `GET/POST /api/posts`, `GET/POST /api/post-replies` (new optional `parentReplyId`), `PUT/GET/DELETE /api/likes`, `POST /api/images` | User ("use the routes we have made") |
| D6 | The shown number is `like_count`, which **counts likes only**. Like → +1. Like→dislike → −1, and the row is kept with `is_like = false`. Dislike→like → +1. Undoing either one (tap again) **deletes the row** via `DELETE /api/likes/:type/:id`, and −1 only if it was a like. Already implemented and race-safe in `likes.repo.ts` (`changeCount` + `iLikeIt` in one batch) | Default (matches the request) |
| D7 | `reply_count` on a post counts replies **at every level**. Deleting a reply deletes its answers and subtracts the whole thread (same recursive CTE as `blog_comments`) | Default |
| D8 | Each reply carries `replyCount` (number of direct answers), computed in the list query with a subquery, not a stored column, so it can't drift | Default |
| D9 | «Δες όλες τις αναρτήσεις» opens the existing **Messages tab** (`/community`), which reads the API. The in-memory `CommunityProvider` and `EXAMPLE_POSTS` go away | Default |
| D10 | The app updates optimistically (counts and pressed state change at once) and puts the server's answer (`{ likeCount, isLike }`) in place; on error it rolls back and shows a short message | Default |
| D11 | Lists: posts newest first, 20 per page, more on scroll. The «Δημοφιλή» sort is removed for now, because the API sorts only by newest (see Open items) | Default |
| D12 | Editing and deleting your own posts and replies is **not in this plan**. The API already allows it; the UI can come later | Default |

## 1 — Risks and blockers

1. **Remote DB:** migrations 0005, 0006 and 0007 are still unapplied remotely, and this adds 0008. All
   must be applied (`npx wrangler d1 migrations apply DB --remote`, with the user's approval) before the
   app build that uses this.
2. **Counter correctness with nesting:** three places delete replies and must subtract whole threads:
   `deletePostReply`, `deleteUser` (`admin/users.delete.ts`), and `deletePost`. The last is fine, since
   everything cascades with the post. `deleteUser` today subtracts only the user's own replies, so it
   must use the thread CTE (like its blog-comments step).
3. **App needs a new build** for phones (no OTA updates). Web works right away.
4. **Photo upload on phones** uses `expo-image-picker`, already a dependency (used in `note-editor.tsx`).
   No new native module.

## 2 — Architecture

```
Home (index.tsx)
 └─ AskCard ──POST /api/images (photos)──► R2 + images
            └─POST /api/posts {title, content, imageIds}──► posts (+post_images)
            └─ «Δες όλες τις αναρτήσεις» → /community

/community (list)  GET /api/posts?cursor=          + GET /api/likes?type=post&ids=…   (my reactions)
/community/[id]    GET /api/posts/:id
                   GET /api/post-replies?postId=   (top level)  + GET /api/likes?type=post_reply&ids=…
                   GET /api/post-replies?postId=&parentReplyId=  (on «Απαντήσεις (n)»)
                   POST /api/post-replies {postId, parentReplyId?, content}
like/dislike       PUT /api/likes {type, id, isLike}  ·  undo: DELETE /api/likes/:type/:id
```

## 3 — Backend

**Schema + migration 0008** (`backend/src/db/schema.ts`, `drizzle/0008_*.sql`):
- `postReplies.parentReplyId: integer('parent_reply_id').references((): AnySQLiteColumn => postReplies.id, { onDelete: 'cascade' })`.
- Index `post_replies_parent_idx (parent_reply_id)`. Relations `parent` and `replies` (relation name
  `reply_replies`), like `blogCommentsRelations`.
- Plain `ALTER TABLE … ADD COLUMN` plus `CREATE INDEX`: no table rebuild, existing rows get `NULL`
  (top level).

**Shared** (`packages/shared/src/posts.ts`):
- `replyCreate`: add `parentReplyId: entityId.nullable().default(null)`.
- `replyFilter`: add `parentReplyId: queryId.optional()` (absent = top level).
- `PostReply`: add `parentReplyId: number | null` and `replyCount: number` (direct answers).
- `postCreate` stays as is; the app makes the title (D1).

**`post-replies.repo.ts`:**
- `list`: `parentReplyId ? eq(parent, id) : isNull(parent)`; `replyCount` via
  `extras: { replyCount: sql<number>`(SELECT count(*) FROM post_replies a WHERE a.parent_reply_id = ${postReplies.id})` }`.
  Oldest first under a comment reads more naturally, but keep newest first for consistency with keyset
  pagination (see Open items).
- `create`: when `parentReplyId` is given, check it belongs to the same `postId` (400
  `UNKNOWN_REFERENCE` at `parentReplyId`, copied from `blog-comments.repo.ts`). `reply_count + 1` as today.
- `deletePostReply`: copy the blog-comments version. A `thread(id, what)` recursive CTE over
  `post_replies`; subtract `count(*)` of the thread from `posts.reply_count`; delete the thread's
  likes (`deleteLikesOf(db, 'post_reply', sql`(${thread(id,'id')})`)`); delete the reply (its answers
  cascade).

**`admin/users.delete.ts`:** step 2 becomes "threads the user started or joined" for post replies (a
`USER_REPLY_THREADS` CTE like `USER_THREADS`): subtract each post's thread count, and delete likes of
the threads' replies. Test with a reply by another user under the deleted user's reply.

**Likes:** no change. Verify by test that like → dislike → undo leaves no row and `like_count` back at
its start.

## 4 — App

**API layer** (`app/src/api/`):
- `posts.ts`: `postsApi.list(cursor)`, `get(id)`, `create({title, content, imageIds})`.
- `postReplies.ts`: `list(postId, parentReplyId?, cursor)`, `create({postId, parentReplyId, content})`.
- `likes.ts`: `mine(type, ids)`, `set(type, id, isLike)`, `undo(type, id)`.
- `images.ts`: move `uploadImages(assets)` out of `notes.ts`, so notes and posts share it.
  `client.ts` `request` is reused; signed-in requests already send the session.

**Hooks** (`app/src/lib/`):
- `posts.ts`: `usePosts()` and `usePost(id)` via `usePagedList` / `useApiItem` (`lib/use-api.ts`).
- `useReplies(postId, parentReplyId)`: one paged list per opened thread.
- `reactions.ts`: `useReactions(type, items)` loads my reactions for the visible ids (`GET /api/likes`,
  max 100 ids per call) and returns `{ stateOf(id), toggle(id, 'like' | 'dislike') }`. `toggle` handles:
  - same as current → `undo`
  - different or none → `set`
  - optimistic count `±1` by D6, then the server's `likeCount` wins

**Home card** (`components/home/ask-card.tsx`):
- **Question box:** focusing it reveals a **«Τίτλος (προαιρετικός)»** input above it (animated in,
  respects reduced motion).
- **Photos:** the «Εικόνα» checkbox becomes «+ Φωτογραφία», which opens the gallery (max 4,
  `expo-image-picker`). Small thumbnails with ✕.
- **«Αποστολή»:** `title = trimmed title || firstSentence(question)`, upload photos, then `postsApi.create`.
  Shows «Η ερώτησή σου δημοσιεύτηκε» with a link to the post. Errors show under the card. The button
  is disabled while sending.
- **«Δες όλες τις αναρτήσεις»:** a pill button below the card → `router.navigate('/community')`.
- `firstSentence(text)`: in `lib/posts.ts`. It cuts at `.`, `;` (the Greek question mark), `?`, `!` or
  a newline, max 120 chars at a word boundary.

**List** (`app/(app)/community/index.tsx`):
- `FlatList` of `usePosts()`: title (bold), the start of the text, the first photo as a small
  thumbnail, author and relative date, like/dislike (`useReactions('post', …)`) and «Απαντήσεις (n)» →
  post page.
- `BottomComposer` stays: it creates a text-only post, with the title from the first sentence.
- Loading, empty, error-with-retry and pull-to-refresh states.

**Post page** (`app/(app)/community/[id].tsx`):
- **Post:** title, full text, photos (reuse `PlantGallery`), like/dislike, and the box «Γράψε
  απάντηση…» (top-level reply).
- **Comments:** top-level replies. Each has like/dislike, «Απάντηση» (opens an input under it, as now)
  and **«Απαντήσεις (n)»**, which loads its answers (`useReplies(postId, reply.id)`) and nests them
  with the existing `ReplyThread` indentation. Tapping again hides them.
- **New reply:** a new answer is added to its open thread, and the parent's count is bumped.

**Components:**
- `DiscussionItem` becomes controlled: it takes `reaction`, `likeCount` and `onReact` props instead of
  local state, plus an optional `title`, `images` and «Απαντήσεις (n)» toggle.
- `ReplyThread` takes API replies (`PostReply`) and a `renderAnswers(reply)` slot.
- **Removed:** `lib/community.tsx` (`CommunityProvider`, removed from `(app)/_layout.tsx`) and
  `config/community-posts.ts`. Date labels («2 ημέρες πριν») come from `createdAt` through a small
  `timeAgo()` in `lib/format.ts`.

## Testing

- **Backend E2E** (scratch DB, two users, signed cookies, like the plan 01 tests):
  - create a post with 2 images; list and get it
  - nested replies 3 levels deep; `replyCount` per reply; a `parentReplyId` from another post → 400
  - `reply_count` after adds and after deleting a middle reply (the thread is subtracted)
  - likes: like → count+1; like→dislike → count back and the row has `is_like=0`; undo → no row, count
    unchanged; dislike→like → +1; two users at once
  - delete a user whose reply was answered by someone else: the counts are right
- **App:** typecheck, lint, and on web with a local backend:
  - ask from home (with and without a title, with a photo) → it appears in the list
  - like/dislike, toggle and undo, checked by reloading (counts persist)
  - nested replies open and close
  - phone width
- `expo-doctor`, plus one preview build on a phone (photo picker).

## Task list

| # | Task | Files |
|---|---|---|
| 1 | Schema `parent_reply_id` + relations, migration 0008 (local) | `backend/src/db/schema.ts`, `backend/drizzle/0008_*` |
| 2 | Shared reply schemas/types (`parentReplyId`, `replyCount`) | `packages/shared/src/posts.ts` |
| 3 | Replies repo: filter, `replyCount`, parent check, thread delete | `backend/src/resources/post-replies/post-replies.repo.ts` |
| 4 | User deletion with nested reply threads | `backend/src/resources/admin/users.delete.ts` |
| 5 | Backend E2E for 3–4 and the like rules | scratchpad |
| 6 | App API: posts, replies, likes, shared image upload | `app/src/api/{posts,postReplies,likes,images}.ts`, `notes.ts` |
| 7 | Hooks: posts, replies, reactions, `firstSentence`, `timeAgo` | `app/src/lib/{posts,reactions,format}.ts` |
| 8 | Controlled `DiscussionItem`, API-based `ReplyThread` | `app/src/components/discussion/*` |
| 9 | Home card: title on focus, photo picker, send, «Δες όλες τις αναρτήσεις» | `app/src/components/home/ask-card.tsx` |
| 10 | Messages list on the API | `app/src/app/(app)/community/index.tsx` |
| 11 | Post page with nested replies | `app/src/app/(app)/community/[id].tsx` |
| 12 | Remove `CommunityProvider` / example posts | `app/src/lib/community.tsx`, `app/src/config/community-posts.ts`, `app/src/app/(app)/_layout.tsx` |
| 13 | Web check, docs line in `instructions/adding-a-resource.md` (nested replies) | — |
| 14 | **With approval:** remote migrations 0005–0008, then commit/push, then a preview build | — |

Files **not** touched: the admin dashboard pages (apart from `users.delete.ts` correctness), the
likes routes and repo, `Experiments/`, `TakeTheTrip`, secrets / `.dev.vars`.

## Open items

- «Δημοφιλή» (most liked first) needs a second ordering in `GET /api/posts` (e.g. `?sort=popular` with
  a `(like_count, id)` cursor). Add it now or later? Default: later.
- Order of answers under a comment: newest first (default, matches the API) or oldest first (reads like
  a conversation)?
- Should dislikes show a number too? This needs a `dislike_count` column. Default: no, only likes are
  counted, as requested.
