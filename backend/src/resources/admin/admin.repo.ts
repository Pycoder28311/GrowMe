import { sql } from 'drizzle-orm'
import type { Db } from '../../db'
import {
  blogComments,
  blogs,
  combinations,
  images,
  plants,
  postReplies,
  posts,
  tips,
  user,
} from '../../db/schema'

/**
 * Tables shown on the dashboard, with their Greek labels and the page each card opens; `create` for
 * the ones with a form (their card gets «+ Δημιουργία», straight to the empty form)
 */
const TABLES = [
  { key: 'users', label: 'Χρήστες', table: user, path: '/users' },
  { key: 'plants', label: 'Φυτά', table: plants, path: '/plants', create: true },
  { key: 'tips', label: 'Συμβουλές', table: tips, path: '/tips', create: true },
  { key: 'combinations', label: 'Συνδυασμοί', table: combinations, path: '/combinations', create: true },
  { key: 'blogs', label: 'Άρθρα', table: blogs, path: '/blogs', create: true },
  { key: 'blogComments', label: 'Σχόλια άρθρων', table: blogComments, path: '/blog-comments' },
  { key: 'posts', label: 'Αναρτήσεις', table: posts, path: '/posts' },
  { key: 'postReplies', label: 'Απαντήσεις', table: postReplies, path: '/post-replies' },
  { key: 'images', label: 'Εικόνες', table: images, path: '/images' },
] as const

export type TableCount = { key: string; label: string; path: string; count: number; create: boolean }

/** Row count of every table in one query (each count reads its table's rows: fine for a dashboard) */
export async function tableCounts(db: Db): Promise<TableCount[]> {
  const columns = TABLES.map(({ key, table }) => sql`(SELECT count(*) FROM ${table}) AS ${sql.identifier(key)}`)
  const row = await db.get<Record<string, number>>(sql`SELECT ${sql.join(columns, sql`, `)}`)
  return TABLES.map((t) => ({
    key: t.key,
    label: t.label,
    path: t.path,
    count: row?.[t.key] ?? 0,
    create: 'create' in t && t.create,
  }))
}
