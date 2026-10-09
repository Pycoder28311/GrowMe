import { and, eq, inArray, notInArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { Db } from '../db'
import { HttpError } from './errors'

/** A many-to-many link table, e.g. post_images(post_id, image_id, position) */
export type LinkTable<T extends SQLiteTable> = {
  table: T
  parent: SQLiteColumn // the column pointing to the parent, e.g. postImages.postId
  toRow: (parentId: number, childId: number, position: number) => T['$inferInsert']
}

/**
 * Statements that replace all links of one parent with an ordered list of children.
 * Returned (not run) so callers can run them in one db.batch() together with their own writes.
 */
export function replaceLinks<T extends SQLiteTable>(db: Db, link: LinkTable<T>, parentId: number, childIds: number[]) {
  const removeOld = db.delete(link.table).where(eq(link.parent, parentId))
  if (childIds.length === 0) return [removeOld] as const
  const rows = childIds.map((childId, i) => link.toRow(parentId, childId, i))
  return [removeOld, db.insert(link.table).values(rows as never)] as const
}

/** Ids that were linked before but are not in the new list (e.g. images to clean up) */
export const removedIds = (before: number[], after: number[]) => before.filter((id) => !after.includes(id))

/** True if every id exists in `table` and belongs to `userId` (stops linking someone else's rows) */
export async function ownsAll(
  db: Db,
  table: SQLiteTable,
  cols: { id: SQLiteColumn; owner: SQLiteColumn },
  ids: number[],
  userId: string,
) {
  if (ids.length === 0) return true
  const rows = await db
    .select({ id: cols.id })
    .from(table)
    .where(and(inArray(cols.id, ids), eq(cols.owner, userId)))
  return rows.length === new Set(ids).size
}

/** Throws 400 UNKNOWN_REFERENCE when no row has this id (e.g. a reply's postId); `field` names it in the error */
export async function assertExists(db: Db, table: SQLiteTable, idColumn: SQLiteColumn, id: number, field: string) {
  const row = await db.select({ id: idColumn }).from(table).where(eq(idColumn, id)).get()
  if (!row) {
    throw new HttpError(400, 'UNKNOWN_REFERENCE', `Unknown ${field}`, [{ path: field, message: 'Not found' }])
  }
}

/** db.batch() for a statement list built at runtime (one transaction); does nothing when it's empty */
export async function runBatch(db: Db, statements: BatchItem<'sqlite'>[]) {
  if (statements.length === 0) return
  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
}

/** A table of rows that belong to one parent, e.g. lifecycles(plant_id) */
export type ChildTable<T extends SQLiteTable, TRow> = {
  table: T
  id: SQLiteColumn // the child's own id column
  parent: SQLiteColumn // the column pointing to the parent, e.g. lifecycles.plantId
  /** Columns to write for one row; position = its index in the list */
  toRow: (parentId: number, row: TRow, position: number) => T['$inferInsert']
}

/**
 * Throws 400 UNKNOWN_REFERENCE (path e.g. "lifecycles.2.id") when a row's id is not one of the parent's
 * existing children: stops a form from editing another parent's rows.
 */
export function assertOwnChildren(field: string, rows: { id?: number }[], existingIds: number[]) {
  const details = rows
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => row.id !== undefined && !existingIds.includes(row.id))
    .map(({ i }) => ({ path: `${field}.${i}.id`, message: 'Not found' }))
  if (details.length > 0) throw new HttpError(400, 'UNKNOWN_REFERENCE', `Unknown ${field}`, details)
}

/**
 * Statements that make a parent's children equal to `rows` (in that order): rows with an id are
 * updated, rows without one are inserted, children left out are deleted. Returned (not run) so they
 * go in one db.batch() with the parent's own writes. Check ids first with assertOwnChildren().
 */
export function syncChildren<T extends SQLiteTable, TRow extends { id?: number }>(
  db: Db,
  child: ChildTable<T, TRow>,
  parentId: number,
  rows: TRow[],
): BatchItem<'sqlite'>[] {
  const kept = rows.flatMap((row) => (row.id === undefined ? [] : [row.id]))
  const ofParent = eq(child.parent, parentId)
  const statements: BatchItem<'sqlite'>[] = [
    db.delete(child.table).where(kept.length > 0 ? and(ofParent, notInArray(child.id, kept)) : ofParent),
  ]
  const inserts: T['$inferInsert'][] = []
  rows.forEach((row, position) => {
    const values = child.toRow(parentId, row, position)
    if (row.id === undefined) inserts.push(values)
    else statements.push(db.update(child.table).set(values as never).where(and(ofParent, eq(child.id, row.id))))
  })
  if (inserts.length > 0) statements.push(db.insert(child.table).values(inserts as never))
  return statements
}
