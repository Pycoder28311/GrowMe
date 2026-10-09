import { MAX_MONTH_RANGES, type MonthRange, type PlantFilterFields } from '@growme/shared'
import type { plants } from '../../db/schema'

type PlantRow = typeof plants.$inferSelect

/** The 3 month-range column pairs, in order */
const MONTH_COLUMNS = [
  ['monthStart', 'monthEnd'],
  ['monthStart2', 'monthEnd2'],
  ['monthStart3', 'monthEnd3'],
] as const satisfies readonly (readonly [keyof PlantRow, keyof PlantRow])[]

type MonthColumns = { [K in (typeof MONTH_COLUMNS)[number][number]]: number | null }

/** A plant row's month ranges, in order (empty pairs skipped) */
export const monthRangesOf = (p: MonthColumns): MonthRange[] =>
  MONTH_COLUMNS.flatMap(([start, end]) => {
    const from = p[start]
    const to = p[end]
    return from != null && to != null ? [[from, to] as MonthRange] : []
  })

/** The columns for a list of month ranges: pairs filled in order, the rest emptied */
export function monthColumns(ranges: readonly MonthRange[]): MonthColumns {
  const columns = {} as MonthColumns
  MONTH_COLUMNS.slice(0, MAX_MONTH_RANGES).forEach(([start, end], i) => {
    columns[start] = ranges[i]?.[0] ?? null
    columns[end] = ranges[i]?.[1] ?? null
  })
  return columns
}

/**
 * An API body's fields as columns: `monthRanges` becomes the month columns (only when sent, so an
 * update without it keeps the ranges); everything else keeps its name.
 */
export function toColumns<T extends { monthRanges?: readonly MonthRange[] }>({ monthRanges, ...rest }: T) {
  return { ...rest, ...(monthRanges ? monthColumns(monthRanges) : {}) }
}

/** What the app's plant filters read; the plant API and the search index both send it */
export const toFilterFields = (p: PlantRow): PlantFilterFields => ({
  priceMin: p.priceMin,
  priceMax: p.priceMax,
  sunStart: p.sunStart,
  sunEnd: p.sunEnd,
  monthRanges: monthRangesOf(p),
  wind: p.wind,
  kind: p.kind,
  size: p.size,
  difficulty: p.difficulty as PlantFilterFields['difficulty'],
  food: p.food,
  aromatic: p.aromatic,
  climbing: p.climbing,
  ornamental: p.ornamental,
  succulent: p.succulent,
  smallTree: p.smallTree,
  privacy: p.privacy,
  nearSea: p.nearSea,
  frostHardy: p.frostHardy,
})
