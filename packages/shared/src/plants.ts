import { z } from 'zod'
import { visibleLength } from './blog-links'
import { entityId, imageIds, queryId, type ImageRef } from './common'

const title = z.string().trim().min(1).max(200)
const text = z.string().trim().min(1).max(10000)
const month = z.number().int().min(1).max(12)
const nonNegative = z.number().int().min(0)

/** min must not be larger than max when both are sent */
const rangesInOrder = (p: {
  priceMin?: number | null
  priceMax?: number | null
  sunlightHoursMin?: number | null
  sunlightHoursMax?: number | null
}) =>
  (p.priceMin == null || p.priceMax == null || p.priceMin <= p.priceMax) &&
  (p.sunlightHoursMin == null || p.sunlightHoursMax == null || p.sunlightHoursMin <= p.sunlightHoursMax)

const rangeMessage = { message: 'Minimum must not be larger than maximum' }

/**
 * food / native / seeds: a short text, empty = not shown. It may hold blog links: 60 characters
 * of what a reader sees, the markers aside (the message matches the usual one)
 */
const trait = z
  .string()
  .trim()
  .max(400)
  .refine((t) => visibleLength(t) <= 60, { message: 'Too big: expected string to have <=60 characters' })
  .nullable()

/** What the dashboard suggests for each trait (any other text is fine too) */
export const PLANT_TRAIT_SUGGESTIONS = {
  food: ['Φαγώσιμο', 'Τρώγονται τα φύλλα', 'Τρώγεται ο καρπός', 'Αρωματικό για μαγείρεμα', 'Μη φαγώσιμο', 'Τοξικό'],
  seeds: ['Από σπόρο', 'Από φυτό', 'Σπόρος ή φυτό', 'Από μόσχευμα', 'Από βολβό'],
  native: ['Ιθαγενές της Ελλάδας', 'Ιθαγενές της Μεσογείου', 'Εισαγόμενο'],
} as const

/* ─────────────── Plants (written by admins) ─────────────── */

const plantFields = z.object({
  combinationId: entityId.nullable(),
  name: title,
  scientificName: title,
  description: text.nullable(),
  priceMin: nonNegative.nullable(), // in cents
  priceMax: nonNegative.nullable(),
  seeds: trait,
  native: trait,
  food: trait,
  difficulty: z.number().int().min(1).max(5),
  sunlightHoursMin: z.number().int().min(0).max(24).nullable(),
  sunlightHoursMax: z.number().int().min(0).max(24).nullable(),
  monthStart: month.nullable(),
  monthEnd: month.nullable(), // may be smaller than monthStart (e.g. Nov–Feb)
  imageIds,
})

export const plantCreate = plantFields
  .extend({
    combinationId: plantFields.shape.combinationId.default(null),
    description: plantFields.shape.description.default(null),
    priceMin: plantFields.shape.priceMin.default(null),
    priceMax: plantFields.shape.priceMax.default(null),
    seeds: plantFields.shape.seeds.default(null),
    native: plantFields.shape.native.default(null),
    food: plantFields.shape.food.default(null),
    sunlightHoursMin: plantFields.shape.sunlightHoursMin.default(null),
    sunlightHoursMax: plantFields.shape.sunlightHoursMax.default(null),
    monthStart: plantFields.shape.monthStart.default(null),
    monthEnd: plantFields.shape.monthEnd.default(null),
    imageIds: imageIds.default([]),
  })
  .refine(rangesInOrder, rangeMessage)

/** Send only what changes; imageIds replaces the whole list */
export const plantUpdate = plantFields.partial().refine(rangesInOrder, rangeMessage)

/** GET /api/plants?combinationId=3 (optional) */
export const plantFilter = z.object({
  combinationId: queryId.optional(),
})

export type PlantCreate = z.infer<typeof plantCreate>
export type PlantUpdate = z.infer<typeof plantUpdate>
export type PlantFilter = z.infer<typeof plantFilter>

/** A plant in lists: its own fields and images */
export type PlantSummary = {
  id: number
  combinationId: number | null
  name: string
  scientificName: string
  description: string | null
  priceMin: number | null
  priceMax: number | null
  /** e.g. «Από σπόρο»; null = not shown (same for native and food) */
  seeds: string | null
  native: string | null
  food: string | null
  difficulty: number
  sunlightHoursMin: number | null
  sunlightHoursMax: number | null
  monthStart: number | null
  monthEnd: number | null
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

export const lifecycleCreate = z.object({ plantId: entityId, position: nonNegative, title, content: text })
export const lifecycleUpdate = z.object({
  position: nonNegative.optional(),
  title: title.optional(),
  content: text.optional(),
})
export type LifecycleCreate = z.infer<typeof lifecycleCreate>
export type LifecycleUpdate = z.infer<typeof lifecycleUpdate>
export type Lifecycle = { id: number; plantId: number; position: number; title: string; content: string }

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

/** Both months set (a season) or both empty */
const monthsTogether = (p: { monthStart: number | null; monthEnd: number | null }) =>
  (p.monthStart == null) === (p.monthEnd == null)

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
 * the order of lifecycles, tips and imageIds is their position.
 */
export const plantSave = plantFields
  .extend({
    lifecycles: z.array(z.object({ id: childId, title, content: text })).max(50),
    tips: z
      .array(plantTipRow)
      .max(50)
      .superRefine(uniqueBy((row) => ('tipId' in row ? row.tipId : undefined), 'Tip picked twice', 'tipId')),
    diseases: z.array(z.object({ id: childId, title, label: label.nullable(), content: text })).max(50),
  })
  .refine(rangesInOrder, rangeMessage)
  .refine(monthsTogether, { message: 'Set both months or neither', path: ['monthEnd'] })

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
