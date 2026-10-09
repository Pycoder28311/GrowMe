import { z } from 'zod'
import { visibleLength } from './blog-links'
import { entityId, imageIds, queryId, type ImageRef } from './common'
import { optionalRichText, richTextNoImages } from './rich-text'
import {
  DIFFICULTIES,
  MAX_MONTH_RANGES,
  PLANT_FLAG_KEYS,
  PLANT_KINDS,
  PLANT_SIZES,
  WIND_LEVELS,
  parseDuration,
  type Difficulty,
  type MonthRange,
  type PlantFlag,
  type PlantFlags,
  type PlantKind,
  type PlantSize,
  type WindLevel,
} from './plant-fields'

const title = z.string().trim().min(1).max(200)
const text = z.string().trim().min(1).max(10000)
const month = z.number().int().min(1).max(12)
const nonNegative = z.number().int().min(0)

/** min must not be larger than max when both are sent */
const priceInOrder = (p: { priceMin?: number | null; priceMax?: number | null }) =>
  p.priceMin == null || p.priceMax == null || p.priceMin <= p.priceMax

const rangeMessage = { message: 'Minimum must not be larger than maximum' }

/** The sun window: both hours or neither, and it ends after it starts (when both are sent) */
const sunInOrder = (p: { sunStart?: number | null; sunEnd?: number | null }) =>
  p.sunStart === undefined || p.sunEnd === undefined
    ? true
    : (p.sunStart === null) === (p.sunEnd === null) && (p.sunStart === null || p.sunStart < p.sunEnd!)

const sunMessage = { message: 'Set both hours, the end after the start', path: ['sunEnd'] }

/** native: a short text, empty = not shown. It may hold blog links: 60 characters of what a reader
 * sees, the markers aside (the message matches the usual one) */
const trait = z
  .string()
  .trim()
  .max(400)
  .refine((t) => visibleLength(t) <= 60, { message: 'Too big: expected string to have <=60 characters' })
  .nullable()

/** «4-6 weeks» or «2 years» (see parseDuration) */
const duration = z
  .string()
  .trim()
  .max(20)
  .refine((t) => parseDuration(t) !== null, { message: 'Use e.g. "4-6 weeks" or "2 years"' })

/** What the dashboard suggests for the origin (any other text is fine too) */
export const PLANT_TRAIT_SUGGESTIONS = {
  native: ['Ιθαγενές της Ελλάδας', 'Ιθαγενές της Μεσογείου', 'Εισαγόμενο'],
} as const

/* ─────────────── Plants (written by admins) ─────────────── */

/** Every yes/no field of PLANT_FLAGS as a boolean */
const flagFields = Object.fromEntries(PLANT_FLAG_KEYS.map((key) => [key, z.boolean()])) as Record<
  PlantFlag,
  z.ZodBoolean
>
const flagDefaults = Object.fromEntries(PLANT_FLAG_KEYS.map((key) => [key, z.boolean().default(false)])) as Record<
  PlantFlag,
  z.ZodDefault<z.ZodBoolean>
>

const hour = z.number().int().min(0).max(24)

const plantFields = z.object({
  combinationId: entityId.nullable(),
  name: title,
  scientificName: title,
  description: text.nullable(),
  priceMin: nonNegative.nullable(), // in cents
  priceMax: nonNegative.nullable(),
  native: trait,
  ...flagFields,
  wind: z.enum(WIND_LEVELS).nullable(),
  kind: z.enum(PLANT_KINDS).nullable(),
  size: z.enum(PLANT_SIZES).nullable(),
  difficulty: z.literal(DIFFICULTIES), // 1 easy – 3 hard
  sunStart: hour.nullable(), // clock hours, 0–24
  sunEnd: hour.nullable(),
  /** In order; each [from, to] may wrap past December (e.g. Nov–Feb) */
  monthRanges: z.array(z.tuple([month, month])).max(MAX_MONTH_RANGES),
  lifespan: duration.nullable(),
  imageIds,
})

export const plantCreate = plantFields
  .extend({
    combinationId: plantFields.shape.combinationId.default(null),
    description: plantFields.shape.description.default(null),
    priceMin: plantFields.shape.priceMin.default(null),
    priceMax: plantFields.shape.priceMax.default(null),
    native: plantFields.shape.native.default(null),
    ...flagDefaults,
    wind: plantFields.shape.wind.default(null),
    kind: plantFields.shape.kind.default(null),
    size: plantFields.shape.size.default(null),
    sunStart: plantFields.shape.sunStart.default(null),
    sunEnd: plantFields.shape.sunEnd.default(null),
    monthRanges: plantFields.shape.monthRanges.default([]),
    lifespan: plantFields.shape.lifespan.default(null),
    imageIds: imageIds.default([]),
  })
  .refine(priceInOrder, rangeMessage)
  .refine(sunInOrder, sunMessage)

/** Send only what changes; imageIds replaces the whole list */
export const plantUpdate = plantFields.partial().refine(priceInOrder, rangeMessage).refine(sunInOrder, sunMessage)

/** GET /api/plants?combinationId=3 (optional) */
export const plantFilter = z.object({
  combinationId: queryId.optional(),
})

export type PlantCreate = z.infer<typeof plantCreate>
export type PlantUpdate = z.infer<typeof plantUpdate>
export type PlantFilter = z.infer<typeof plantFilter>

/** A plant in lists: its own fields and images */
export type PlantSummary = PlantFlags & {
  id: number
  combinationId: number | null
  name: string
  scientificName: string
  description: string | null
  priceMin: number | null
  priceMax: number | null
  /** e.g. «Ιθαγενές της Μεσογείου»; null = not shown */
  native: string | null
  wind: WindLevel | null
  kind: PlantKind | null
  size: PlantSize | null
  difficulty: Difficulty
  /** The sun window in clock hours (e.g. 10–16); both null when not set */
  sunStart: number | null
  sunEnd: number | null
  monthRanges: MonthRange[]
  /** e.g. «4-6 years» (see durationLabel) */
  lifespan: string | null
  images: ImageRef[]
  createdAt: string
}

/** One plant with everything about it (GET /api/plants/:id, one query) */
export type Plant = PlantSummary & {
  combination: Combination | null
  lifecycles: Lifecycle[]
  tips: Tip[]
  diseases: Disease[]
}

/* ─────────────── Plant details: lifecycles, tips, diseases ─────────────── */

/** GET /api/lifecycles?plantId=1 (same for diseases) */
export const plantChildFilter = z.object({
  plantId: queryId,
})

export type PlantChildFilter = z.infer<typeof plantChildFilter>

/** A stage's time is counted from sowing (e.g. «6-12 months»); `seed` stages come before the plant is
 * sold ready to transplant */
export const lifecycleCreate = z.object({
  plantId: entityId,
  position: nonNegative,
  title,
  content: text,
  seed: z.boolean().default(false),
  duration: duration.nullable().default(null),
})
export const lifecycleUpdate = z.object({
  position: nonNegative.optional(),
  title: title.optional(),
  content: text.optional(),
  seed: z.boolean().optional(),
  duration: duration.nullable().optional(),
})
export type LifecycleCreate = z.infer<typeof lifecycleCreate>
export type LifecycleUpdate = z.infer<typeof lifecycleUpdate>
export type Lifecycle = {
  id: number
  plantId: number
  position: number
  title: string
  content: string
  seed: boolean
  duration: string | null
}

/* Tips are a library: one tip can be on many plants (in each plant's own order) */
export const tipCreate = z.object({ title, content: text })
export const tipUpdate = tipCreate.partial()
/** The dashboard's tip form (title and text) */
export const tipSave = tipCreate
export type TipCreate = z.infer<typeof tipCreate>
export type TipUpdate = z.infer<typeof tipUpdate>
export type TipSave = z.infer<typeof tipSave>
export type Tip = { id: number; title: string; content: string }
/** A tip in the library's list: how many plants show it */
export type TipSummary = Tip & { plantCount: number }

const label = z.string().trim().min(1).max(100)
export const diseaseCreate = z.object({ plantId: entityId, title, label: label.nullable().default(null), content: text })
export const diseaseUpdate = z.object({ title: title.optional(), label: label.nullable().optional(), content: text.optional() })
export type DiseaseCreate = z.infer<typeof diseaseCreate>
export type DiseaseUpdate = z.infer<typeof diseaseUpdate>
export type Disease = { id: number; plantId: number; title: string; label: string | null; content: string }

/* ─────────────── Admin dashboard: a plant with all its details in one save ─────────────── */

/** With id: an existing row (updated); without: a new row. A row left out of the list is deleted. */
const childId = entityId.optional()

/** Seed stages first: the error points at the first seed stage after a plant stage */
const seedStagesFirst = (rows: { seed: boolean }[], ctx: z.RefinementCtx) => {
  const firstPlant = rows.findIndex((row) => !row.seed)
  const late = firstPlant < 0 ? -1 : rows.findIndex((row, i) => i > firstPlant && row.seed)
  if (late >= 0) ctx.addIssue({ code: 'custom', message: 'Seed stages go before the plant stages', path: [late, 'seed'] })
}

/** A tip row of the plant form: one from the library ({ tipId }) or a new one ({ title, content }) */
const plantTipRow = z.union([z.object({ tipId: entityId }).strict(), z.object({ title, content: text }).strict()])

/** The same id at most once in a list (`key` reads it from a row); the error points at the repeat (and `field` in it) */
const uniqueBy =
  <T>(key: (row: T) => number | undefined, message: string, field?: string) =>
  (rows: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<number>()
    rows.forEach((row, i) => {
      const id = key(row)
      if (id === undefined) return
      if (seen.has(id)) ctx.addIssue({ code: 'custom', message, path: field ? [i, field] : [i] })
      seen.add(id)
    })
  }

/**
 * The plant form's body (PUT/POST /api/admin/plants). Every field is sent (nothing is optional);
 * the order of lifecycles, tips and imageIds is their position. The description and each «Τι να
 * προσέχεις» text are formatted texts from the editor (rich-text.ts, no photos); they are stored as
 * JSON text, and readers parse them with parseRichContent (older plain texts still read fine).
 */
export const plantSave = plantFields
  .extend({
    description: optionalRichText,
    lifecycles: z
      .array(z.object({ id: childId, title, content: text, seed: z.boolean(), duration: duration.nullable() }))
      .max(50)
      .superRefine(seedStagesFirst),
    tips: z
      .array(plantTipRow)
      .max(50)
      .superRefine(uniqueBy((row) => ('tipId' in row ? row.tipId : undefined), 'Tip picked twice', 'tipId')),
    diseases: z
      .array(z.object({ id: childId, title, label: label.nullable(), content: richTextNoImages }))
      .max(50),
  })
  .refine(priceInOrder, rangeMessage)
  .refine(sunInOrder, sunMessage)

export type PlantSave = z.infer<typeof plantSave>

/* ─────────────── Combinations ─────────────── */

export const combinationCreate = z.object({ title, description: text.nullable().default(null) })
export const combinationUpdate = z.object({ title: title.optional(), description: text.nullable().optional() })
/** The dashboard's combination form: the plants in it (a plant is in one combination at most) */
export const combinationSave = z.object({
  title,
  description: text.nullable(),
  plantIds: z
    .array(entityId)
    .max(500)
    .superRefine(uniqueBy((id) => id, 'Plant picked twice')),
})
export type CombinationCreate = z.infer<typeof combinationCreate>
export type CombinationSave = z.infer<typeof combinationSave>
export type CombinationUpdate = z.infer<typeof combinationUpdate>
export type Combination = { id: number; title: string; description: string | null }
