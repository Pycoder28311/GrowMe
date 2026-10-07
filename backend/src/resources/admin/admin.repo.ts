import { sql } from 'drizzle-orm'
import type { Db } from '../../db'
import {
  blogComments,
  blogs,
  combinations,
  images,
  notes,
  plants,
  postReplies,
  posts,
  tips,
  user,
} from '../../db/schema'

/** Tables shown on the dashboard, with their Greek labels and the page each card opens */
const TABLES = [
  { key: 'users', label: 'Χρήστες', table: user, path: '/users' },
  { key: 'plants', label: 'Φυτά', table: plants, path: '/plants' },
  { key: 'tips', label: 'Συμβουλές', table: tips, path: '/tips' },
  { key: 'combinations', label: 'Συνδυασμοί', table: combinations, path: '/combinations' },
  { key: 'blogs', label: 'Άρθρα', table: blogs, path: '/blogs' },
  { key: 'blogComments', label: 'Σχόλια άρθρων', table: blogComments, path: '/blog-comments' },
  { key: 'posts', label: 'Αναρτήσεις', table: posts, path: '/posts' },
  { key: 'postReplies', label: 'Απαντήσεις', table: postReplies, path: '/post-replies' },
  { key: 'images', label: 'Εικόνες', table: images, path: '/images' },
  { key: 'notes', label: 'Σημειώσεις', table: notes, path: '/notes' },
] as const

export type TableCount = { key: string; label: string; path: string; count: number }

/** Row count of every table in one query (each count reads its table's rows: fine for a dashboard) */
export async function tableCounts(db: Db): Promise<TableCount[]> {
  const columns = TABLES.map(({ key, table }) => sql`(SELECT count(*) FROM ${table}) AS ${sql.identifier(key)}`)
  const row = await db.get<Record<string, number>>(sql`SELECT ${sql.join(columns, sql`, `)}`)
  return TABLES.map(({ key, label, path }) => ({ key, label, path, count: row?.[key] ?? 0 }))
}
