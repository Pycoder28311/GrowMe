import { z } from 'zod'
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

/* ─────────────── Plants (written by admins) ─────────────── */

const plantFields = z.object({
  combinationId: entityId.nullable(),
  name: title,
  scientificName: title,
  description: text.nullable(),
  priceMin: nonNegative.nullable(), // in cents
  priceMax: nonNegative.nullable(),
  seeds: z.boolean(),
  native: z.boolean(),
  food: z.boolean(),
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
    seeds: plantFields.shape.seeds.default(false),
    native: plantFields.shape.native.default(false),
    food: plantFields.shape.food.default(false),
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
  seeds: boolean
  native: boolean
  food: boolean
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

/** GET /api/lifecycles?plantId=1 (same for tips and diseases) */
export const plantChildFilter = z.object({
  plantId: queryId,
})

export type PlantChildFilter = z.infer<typeof plantChildFilter>

export const lifecycleCreate = z.object({ plantId: entityId, title, content: text })
export const lifecycleUpdate = z.object({ title: title.optional(), content: text.optional() })
export type LifecycleCreate = z.infer<typeof lifecycleCreate>
export type LifecycleUpdate = z.infer<typeof lifecycleUpdate>
export type Lifecycle = { id: number; plantId: number; title: string; content: string }

export const tipCreate = z.object({ plantId: entityId, position: nonNegative, title, content: text })
export const tipUpdate = z.object({ position: nonNegative.optional(), title: title.optional(), content: text.optional() })
export type TipCreate = z.infer<typeof tipCreate>
export type TipUpdate = z.infer<typeof tipUpdate>
export type Tip = { id: number; plantId: number; position: number; title: string; content: string }

const label = z.string().trim().min(1).max(100)
export const diseaseCreate = z.object({ plantId: entityId, title, label: label.nullable().default(null), content: text })
export const diseaseUpdate = z.object({ title: title.optional(), label: label.nullable().optional(), content: text.optional() })
export type DiseaseCreate = z.infer<typeof diseaseCreate>
export type DiseaseUpdate = z.infer<typeof diseaseUpdate>
export type Disease = { id: number; plantId: number; title: string; label: string | null; content: string }

/* ─────────────── Combinations ─────────────── */

export const combinationCreate = z.object({ title, description: text.nullable().default(null) })
export const combinationUpdate = z.object({ title: title.optional(), description: text.nullable().optional() })
export type CombinationCreate = z.infer<typeof combinationCreate>
export type CombinationUpdate = z.infer<typeof combinationUpdate>
export type Combination = { id: number; title: string; description: string | null }
