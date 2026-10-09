import { asc, desc, eq, sql } from 'drizzle-orm'
import { blogComments, images, postImages, postReplies, posts, user } from '../../db/schema'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../lib/pagination'
import { deleteBlogComment } from '../blog-comments/blog-comments.repo'
import { deleteImages, imageUrl } from '../images/images.repo'
import { deletePostReply } from '../post-replies/post-replies.repo'
import { deletePost } from '../posts/posts.repo'
import { adminResource, numericId } from './resource'
import { fileSize, formatDate, snippet } from './ui/format'
import { ItemCard } from './ui/pages'
import { deleteUser } from './users.delete'

// The dashboard's other tables: a list with a delete button on each item, no create or edit.
// Each delete keeps the related counters right (it reuses the same delete as the app's API).

/** The fields every simple list item shows (see ItemCard) */
type Item = { id: number | string; title: string; lines: (string | null)[]; image?: string | null }

/** One ItemCard per list item; `emoji` stands in for a missing photo, `confirm` overrides the question */
const card =
  (emoji: string, confirm?: (item: Item) => string) =>
  ({ item, deleteUrl }: { item: Item; href: string | null; deleteUrl: string }) => (
    <ItemCard
      title={item.title}
      lines={item.lines}
      image={item.image}
      emoji={emoji}
      href={null}
      deleteUrl={deleteUrl}
      confirm={confirm?.(item)}
    />
  )

/** Runs a delete for a numeric id from the URL; false (404) when it isn't one */
const withId = async (raw: string, fn: (id: number) => Promise<boolean>) => {
  const id = numericId(raw)
  return id !== null && fn(id)
}

export const usersAdmin = adminResource({
  path: 'users',
  title: 'Χρήστες',
  // users have text ids: pages follow SQLite's rowid (newest first)
  async list(ctx, page) {
    const rows = await ctx.db
      .select({
        rowid: sql<number>`${user}.rowid`,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(page.cursor ? sql`${user}.rowid < ${page.cursor}` : undefined)
      .orderBy(sql`${user}.rowid DESC`)
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (u) => u.rowid),
      (u): Item => ({
        id: u.id,
        title: u.name,
        lines: [
          u.email,
          [u.role === 'admin' ? 'Διαχειριστής' : null, u.banned ? 'Αποκλεισμένος' : null, `Από ${formatDate(u.createdAt)}`]
            .filter(Boolean)
            .join(' · '),
        ],
      }),
    )
  },
  remove: (ctx, id) => deleteUser(ctx, id),
  ListItem: card(
    '👤',
    (u) => `Να διαγραφεί οριστικά ο χρήστης «${u.title}»; Θα διαγραφούν και όλα όσα έχει γράψει (αναρτήσεις, απαντήσεις, σχόλια, likes, σημειώσεις, φωτογραφίες).`,
  ),
})

export const postsAdmin = adminResource({
  path: 'posts',
  title: 'Αναρτήσεις',
  async list(ctx, page) {
    const rows = await ctx.db.query.posts.findMany({
      where: beforeCursor(posts.id, page),
      orderBy: desc(posts.id),
      limit: fetchLimit(page),
      with: {
        user: { columns: { name: true } },
        images: { orderBy: asc(postImages.position), limit: 1, with: { image: true } },
      },
    })
    return mapPage(
      toPage(rows, page, (p) => p.id),
      (p): Item => ({
        id: p.id,
        title: p.title,
        image: p.images[0] ? imageUrl(ctx.env, p.images[0].image.key) : null,
        lines: [
          snippet(p.content),
          `${p.user.name} · ${formatDate(p.createdAt)} · ❤️ ${p.likeCount} · 💬 ${p.replyCount}`,
        ],
      }),
    )
  },
  remove: (ctx, raw) => withId(raw, (id) => deletePost(ctx, id)),
  ListItem: card('💬', (p) => `Να διαγραφεί η ανάρτηση «${p.title}» με τις απαντήσεις και τις φωτογραφίες της;`),
})

export const postRepliesAdmin = adminResource({
  path: 'post-replies',
  title: 'Απαντήσεις',
  async list(ctx, page) {
    const rows = await ctx.db.query.postReplies.findMany({
      where: beforeCursor(postReplies.id, page),
      orderBy: desc(postReplies.id),
      limit: fetchLimit(page),
      with: { user: { columns: { name: true } }, post: { columns: { title: true } } },
    })
    return mapPage(
      toPage(rows, page, (r) => r.id),
      (r): Item => ({
        id: r.id,
        title: snippet(r.content, 80),
        lines: [`Στο «${r.post.title}»`, `${r.user.name} · ${formatDate(r.createdAt)} · ❤️ ${r.likeCount}`],
      }),
    )
  },
  remove: (ctx, raw) => withId(raw, (id) => deletePostReply(ctx.db, id)),
  ListItem: card('↩️', () => 'Να διαγραφεί αυτή η απάντηση;'),
})

export const blogCommentsAdmin = adminResource({
  path: 'blog-comments',
  title: 'Σχόλια άρθρων',
  async list(ctx, page) {
    const rows = await ctx.db.query.blogComments.findMany({
      where: beforeCursor(blogComments.id, page),
      orderBy: desc(blogComments.id),
      limit: fetchLimit(page),
      with: { user: { columns: { name: true } }, blog: { columns: { name: true } } },
    })
    return mapPage(
      toPage(rows, page, (c) => c.id),
      (c): Item => ({
        id: c.id,
        title: snippet(c.content, 80),
        lines: [
          `${c.parentCommentId ? 'Απάντηση σε σχόλιο' : 'Σχόλιο'} στο «${c.blog.name}»`,
          `${c.user.name} · ${formatDate(c.createdAt)} · ❤️ ${c.likeCount}`,
        ],
      }),
    )
  },
  remove: (ctx, raw) => withId(raw, (id) => deleteBlogComment(ctx.db, id)),
  ListItem: card('🗨️', () => 'Να διαγραφεί αυτό το σχόλιο μαζί με όλες τις απαντήσεις του;'),
})

export const imagesAdmin = adminResource({
  path: 'images',
  title: 'Εικόνες',
  async list(ctx, page) {
    const rows = await ctx.db
      .select({
        id: images.id,
        key: images.key,
        size: images.size,
        createdAt: images.createdAt,
        userName: user.name,
      })
      .from(images)
      .leftJoin(user, eq(user.id, images.userId))
      .where(beforeCursor(images.id, page))
      .orderBy(desc(images.id))
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (i) => i.id),
      (i): Item => ({
        id: i.id,
        title: `Εικόνα #${i.id}`,
        image: imageUrl(ctx.env, i.key),
        lines: [`${i.userName ?? 'Διαχειριστής'} · ${fileSize(i.size)}`, formatDate(i.createdAt)],
      }),
    )
  },
  remove: (ctx, raw) =>
    withId(raw, async (id) => {
      const found = await ctx.db.select({ id: images.id }).from(images).where(eq(images.id, id)).get()
      if (!found) return false
      await deleteImages(ctx, [id])
      return true
    }),
  ListItem: card('🖼️', () => 'Να διαγραφεί η εικόνα; Θα φύγει και από ό,τι τη χρησιμοποιεί.'),
})
