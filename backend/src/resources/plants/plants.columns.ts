import {
  EFFORT_LEVELS,
  MAX_MONTH_RANGES,
  SEASON_FIELDS,
  type EffortLevel,
  type MonthRange,
  type PlantFilterFields,
  type SeasonField,
} from '@growme/shared'
import type { plants } from '../../db/schema'

type PlantRow = typeof plants.$inferSelect

/** The 3 column pairs (from, to) of each season, in order */
const SEASON_COLUMNS = {
  seedingSeason: [
    ['seedingStart', 'seedingEnd'],
    ['seedingStart2', 'seedingEnd2'],
    ['seedingStart3', 'seedingEnd3'],
  ],
  plantingSeason: [
    ['plantingStart', 'plantingEnd'],
    ['plantingStart2', 'plantingEnd2'],
    ['plantingStart3', 'plantingEnd3'],
  ],
  floweringSeason: [
    ['floweringStart', 'floweringEnd'],
    ['floweringStart2', 'floweringEnd2'],
    ['floweringStart3', 'floweringEnd3'],
  ],
  fruitingSeason: [
    ['fruitingStart', 'fruitingEnd'],
    ['fruitingStart2', 'fruitingEnd2'],
    ['fruitingStart3', 'fruitingEnd3'],
  ],
} as const satisfies Record<SeasonField, readonly (readonly [keyof PlantRow, keyof PlantRow])[]>

type SeasonColumn = (typeof SEASON_COLUMNS)[SeasonField][number][number]
type SeasonColumns = { [K in SeasonColumn]: number | null }

/** A season's ranges from a plant row, in order (empty pairs skipped) */
export const seasonOf = (p: SeasonColumns, field: SeasonField): MonthRange[] =>
  SEASON_COLUMNS[field].flatMap(([start, end]) => {
    const from = p[start]
    const to = p[end]
    return from != null && to != null ? [[from, to] as MonthRange] : []
  })

/** The columns of one season for a list of ranges: pairs filled in order, the rest emptied */
export function seasonColumns(field: SeasonField, ranges: readonly MonthRange[]): Partial<SeasonColumns> {
  const columns: Partial<SeasonColumns> = {}
  SEASON_COLUMNS[field].slice(0, MAX_MONTH_RANGES).forEach(([start, end], i) => {
    columns[start] = ranges[i]?.[0] ?? null
    columns[end] = ranges[i]?.[1] ?? null
  })
  return columns
}

/** The legacy 1–3 `difficulty` column: the hardest level picked (1 when none) */
export const legacyDifficulty = (levels: readonly EffortLevel[]) =>
  Math.max(1, ...levels.map((level) => EFFORT_LEVELS.indexOf(level) + 1))

type Seasons = { [K in SeasonField]?: readonly MonthRange[] }

/**
 * An API body's fields as columns: each season becomes its month columns and `difficultyLevels` also
 * sets the legacy `difficulty` (only when sent, so an update without them keeps what is stored);
 * everything else keeps its name.
 */
export function toColumns<T extends Seasons & { difficultyLevels?: readonly EffortLevel[] }>(input: T) {
  const { seedingSeason: _seeding, plantingSeason: _planting, floweringSeason: _flowering, fruitingSeason: _fruiting, ...rest } = input
  const seasons = SEASON_FIELDS.map((field) => (input[field] ? seasonColumns(field, input[field]) : {}))
  return {
    ...rest,
    ...Object.assign({}, ...seasons),
    ...(input.difficultyLevels ? { difficulty: legacyDifficulty(input.difficultyLevels) } : {}),
  } as Omit<T, SeasonField> &
    Partial<SeasonColumns> &
    (T extends { difficultyLevels: readonly EffortLevel[] } ? { difficulty: number } : { difficulty?: number })
}

/** What the app's plant filters read; the plant API and the search index both send it */
export const toFilterFields = (p: PlantRow): PlantFilterFields => ({
  lifespanMin: p.lifespanMin,
  lifespanMax: p.lifespanMax,
  potSizes: p.potSizes,
  difficultyLevels: p.difficultyLevels,
  timeNeeded: p.timeNeeded,
  toxicity: p.toxicity,
  frostTolerance: p.frostTolerance,
  saltTolerance: p.saltTolerance,
  windTolerance: p.windTolerance,
  sunIntenseStart: p.sunIntenseStart,
  sunIntenseEnd: p.sunIntenseEnd,
  sunSoftStart: p.sunSoftStart,
  sunSoftEnd: p.sunSoftEnd,
  seedingSeason: seasonOf(p, 'seedingSeason'),
  plantingSeason: seasonOf(p, 'plantingSeason'),
  food: p.food,
  aromatic: p.aromatic,
  climbing: p.climbing,
  ornamental: p.ornamental,
  succulent: p.succulent,
  smallTree: p.smallTree,
  greenness: p.greenness,
  evergreen: p.evergreen,
  privacy: p.privacy,
  indoor: p.indoor,
  outdoor: p.outdoor,
})
