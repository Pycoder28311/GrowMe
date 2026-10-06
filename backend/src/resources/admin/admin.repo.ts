import { sql } from 'drizzle-orm'
import type { Db } from '../../db'
import {
  blogComments,
  blogs,
  combinations,
  images,
  likes,
  notes,
  plants,
  postReplies,
  posts,
  user,
} from '../../db/schema'

/** Tables shown on the dashboard, with their Greek labels */
const TABLES = [
  { key: 'users', label: 'Χρήστες', table: user },
  { key: 'plants', label: 'Φυτά', table: plants },
  { key: 'combinations', label: 'Συνδυασμοί', table: combinations },
  { key: 'blogs', label: 'Άρθρα', table: blogs },
  { key: 'blogComments', label: 'Σχόλια άρθρων', table: blogComments },
  { key: 'posts', label: 'Αναρτήσεις', table: posts },
  { key: 'postReplies', label: 'Απαντήσεις', table: postReplies },
  { key: 'likes', label: 'Likes', table: likes },
  { key: 'images', label: 'Εικόνες', table: images },
  { key: 'notes', label: 'Σημειώσεις', table: notes },
] as const

export type TableCount = { key: string; label: string; count: number }

/** Row count of every table in one query (each count reads its table's rows: fine for a dashboard) */
export async function tableCounts(db: Db): Promise<TableCount[]> {
  const columns = TABLES.map(({ key, table }) => sql`(SELECT count(*) FROM ${table}) AS ${sql.identifier(key)}`)
  const row = await db.get<Record<string, number>>(sql`SELECT ${sql.join(columns, sql`, `)}`)
  return TABLES.map(({ key, label }) => ({ key, label, count: row?.[key] ?? 0 }))
}
