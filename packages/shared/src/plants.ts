import { z } from 'zod'
import { visibleLength } from './blog-links'
import { entityId, imageIds, queryId, type ImageRef } from './common'
import { optionalRichText, richTextNoImages } from './rich-text'
import {
  EFFORT_LEVELS,
  LIFECYCLE_TABS,
  MAX_MONTH_RANGES,
  POT_SIZES,
  SUN_MAX_HOUR,
  SUN_MIN_HOUR,
  TOLERANCE_LEVELS,
  TOXICITY,
  flagDefault,
  PLANT_FLAG_KEYS,
  parseDuration,
  type EffortLevel,
  type LifecycleTab,
  type PlantFlag,
  type PlantFlags,
  type PlantSeasons,
  type PotSize,
  type SunFields,
  type ToleranceLevel,
  type Toxicity,
} from './plant-fields'

const title = z.string().trim().min(1).max(200)
const text = z.string().trim().min(1).max(10000)
const month = z.number().int().min(1).max(12)
const nonNegative = z.number().int().min(0)
const years = z.number().int().min(1).max(999)

const sunHours = z.number().int().min(1).max(SUN_MAX_HOUR - SUN_MIN_HOUR)
const sunHour = z.number().int().min(SUN_MIN_HOUR).max(SUN_MAX_HOUR)

/** One sun bar: both hours or neither, and it ends after it starts (when both are sent) */
const barInOrder = (start: keyof SunFields, end: keyof SunFields) => (p: Partial<SunFields>) => {
  const [from, to] = [p[start], p[end]]
  return from === undefined || to === undefined
    ? true
    : (from === null) === (to === null) && (from === null || from < to!)
}
const intenseInOrder = barInOrder('sunIntenseStart', 'sunIntenseEnd')
const softInOrder = barInOrder('sunSoftStart', 'sunSoftEnd')
const barMessage = (end: keyof SunFields) => ({ message: 'Set both hours, the end after the start', path: [end] })

/** The lifespan in years: both or neither, min not larger than max */
const lifespanInOrder = (p: { lifespanMin?: number | null; lifespanMax?: number | null }) =>
  p.lifespanMin === undefined || p.lifespanMax === undefined
    ? true
    : (p.lifespanMin === null) === (p.lifespanMax === null) && (p.lifespanMin === null || p.lifespanMin <= p.lifespanMax!)

/** At least one of indoor / outdoor (when both are sent) */
const placed = (p: { indoor?: boolean; outdoor?: boolean }) =>
  p.indoor === undefined || p.outdoor === undefined || p.indoor || p.outdoor
const placedMessage = { message: 'Pick indoor or outdoor', path: ['outdoor'] }

const lifespanMessage = { message: 'Set both years, the minimum not larger than the maximum', path: ['lifespanMax'] }

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

/** A fixed list picked several at a time (each value at most once) */
const choices = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .array(z.enum(values))
    .max(values.length)
    .refine((list) => new Set(list).size === list.length, { message: 'Picked twice' })

/** The toxicity list: «none» is alone */
const toxicity = choices(TOXICITY).refine((list) => !list.includes('none') || list.length === 1, {
  message: 'None can not be combined with cat or dog',
})

/** Up to MAX_MONTH_RANGES [from, to] ranges, in order; a range may wrap past December (Nov–Feb) */
const seasonRanges = z.array(z.tuple([month, month])).max(MAX_MONTH_RANGES)

const longText = z.string().trim().min(1).max(2000)

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
const flagDefaults = Object.fromEntries(PLANT_FLAG_KEYS.map((key) => [key, z.boolean().default(flagDefault(key))])) as Record<
  PlantFlag,
  z.ZodDefault<z.ZodBoolean>
>

const plantFields = z.object({
  combinationId: entityId.nullable(),
  family: title.nullable(),
  name: title,
  scientificName: title,
  description: text.nullable(),
  native: trait,
  trivia: longText.nullable(),
  secret: longText.nullable(),
  /** Aromatic and ornamental plants: the “Θρεπτική αξία” and “Συμβουλή μαγειρικής” texts */
  nutrition: longText.nullable(),
  cookTip: longText.nullable(),
  ...flagFields,
  lifespanMin: years.nullable(),
  lifespanMax: years.nullable(),
  potSizes: choices(POT_SIZES),
  difficultyLevels: choices(EFFORT_LEVELS),
  timeNeeded: choices(EFFORT_LEVELS),
  toxicity,
  frostTolerance: z.enum(TOLERANCE_LEVELS).nullable(),
  saltTolerance: z.enum(TOLERANCE_LEVELS).nullable(),
  windTolerance: z.enum(TOLERANCE_LEVELS).nullable(),
  /** The sun bars, clock hours (SUN_BARS) */
  sunIntenseStart: sunHour.nullable(),
  sunIntenseEnd: sunHour.nullable(),
  sunSoftStart: sunHour.nullable(),
  sunSoftEnd: sunHour.nullable(),
  /** How many hours of sun the plant wants (the app shows hours − 1 to hours + 1) */
  sunHours: sunHours.nullable(),
  seedingSeason: seasonRanges,
  plantingSeason: seasonRanges,
  imageIds,
})

/** What a new plant gets for every field that may be left out */
const plantDefaults = {
  combinationId: null,
  family: null,
  description: null,
  native: null,
  trivia: null,
  secret: null,
  nutrition: null,
  cookTip: null,
  lifespanMin: null,
  lifespanMax: null,
  potSizes: [],
  difficultyLevels: [],
  timeNeeded: [],
  toxicity: [],
  frostTolerance: null,
  saltTolerance: null,
  windTolerance: null,
  sunIntenseStart: null,
  sunIntenseEnd: null,
  sunSoftStart: null,
  sunSoftEnd: null,
  sunHours: null,
  seedingSeason: [],
  plantingSeason: [],
  imageIds: [],
} as const

/** Every key of plantDefaults made optional with its default (flags have theirs from PLANT_FLAGS) */
const withDefaults = <S extends z.ZodRawShape>(shape: S): { [K in keyof S]: z.ZodDefault<S[K]> | S[K] } =>
  Object.fromEntries(
    Object.entries(shape).map(([key, type]) => {
      const withDefault = (value: unknown) => (type as z.ZodString).default(value as string)
      if (key in plantDefaults) return [key, withDefault(plantDefaults[key as keyof typeof plantDefaults])]
      if (PLANT_FLAG_KEYS.includes(key as PlantFlag)) return [key, withDefault(flagDefault(key as PlantFlag))]
      return [key, type]
    }),
  ) as never

export const plantCreate = z
  .object(withDefaults(plantFields.shape))
  .refine(intenseInOrder, barMessage('sunIntenseEnd'))
  .refine(softInOrder, barMessage('sunSoftEnd'))
  .refine(lifespanInOrder, lifespanMessage)
  .refine(placed, placedMessage)

/** Send only what changes; imageIds replaces the whole list */
export const plantUpdate = plantFields.partial().refine(intenseInOrder, barMessage('sunIntenseEnd'))
  .refine(softInOrder, barMessage('sunSoftEnd'))
  .refine(lifespanInOrder, lifespanMessage)
  .refine(placed, placedMessage)

/** GET /api/plants?combinationId=3 (optional) */
export const plantFilter = z.object({
  combinationId: queryId.optional(),
})

export type PlantCreate = z.infer<typeof plantCreate>
export type PlantUpdate = z.infer<typeof plantUpdate>
export type PlantFilter = z.infer<typeof plantFilter>

/** A plant in lists: its own fields and images */
export type PlantSummary = PlantFlags &
  PlantSeasons &
  SunFields & {
    id: number
    combinationId: number | null
    family: string | null
    name: string
    scientificName: string
    description: string | null
    /** e.g. «Ιθαγενές της Μεσογείου»; null = not shown */
    native: string | null
    /** Whole years; both null when not set */
    lifespanMin: number | null
    lifespanMax: number | null
    /** Hours of sun wanted; the app shows hours − 1 to hours + 1 */
    sunHours: number | null
    potSizes: PotSize[]
    difficultyLevels: EffortLevel[]
    timeNeeded: EffortLevel[]
    toxicity: Toxicity[]
    frostTolerance: ToleranceLevel | null
    saltTolerance: ToleranceLevel | null
    windTolerance: ToleranceLevel | null
    images: ImageRef[]
    createdAt: string
  }

/** One plant with everything about it (GET /api/plants/:id, one query) */
export type Plant = PlantSummary & {
  /** «Ηξερες οτι» and «Μυστικο επιτυχιας» (only here, lists stay small) */
  trivia: string | null
  secret: string | null
  nutrition: string | null
  cookTip: string | null
  combination: Combination | null
  lifecycles: Lifecycle[]
  diseases: Disease[]
}

/* ─────────────── Plant details: lifecycles, diseases ─────────────── */

/** GET /api/lifecycles?plantId=1 (same for diseases) */
export const plantChildFilter = z.object({
  plantId: queryId,
})

export type PlantChildFilter = z.infer<typeof plantChildFilter>

/** A stage's time is counted from sowing (e.g. «6-12 months», optional); a stage is on one tab: from
 * seed, from a ready plant, or care */
export const lifecycleCreate = z.object({
  plantId: entityId,
  position: nonNegative,
  title,
  content: text,
  tab: z.enum(LIFECYCLE_TABS).default('plant'),
  duration: duration.nullable().default(null),
})
export const lifecycleUpdate = z.object({
  position: nonNegative.optional(),
  title: title.optional(),
  content: text.optional(),
  tab: z.enum(LIFECYCLE_TABS).optional(),
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
  tab: LifecycleTab
  duration: string | null
}

const label = z.string().trim().min(1).max(100)
/** A disease: what you see, what it is, what to do (at least one is set) */
const diseaseTexts = {
  symptoms: text.nullable(),
  what: text.nullable(),
  action: text.nullable(),
}
const hasDiseaseText = (d: { symptoms?: unknown; what?: unknown; action?: unknown }) =>
  !!(d.symptoms || d.what || d.action)
const diseaseTextMessage = { message: 'Write at least one of the three texts', path: ['what'] }

export const diseaseCreate = z
  .object({
    plantId: entityId,
    title,
    label: label.nullable().default(null),
    symptoms: diseaseTexts.symptoms.default(null),
    what: diseaseTexts.what.default(null),
    action: diseaseTexts.action.default(null),
  })
  .refine(hasDiseaseText, diseaseTextMessage)
export const diseaseUpdate = z.object({
  title: title.optional(),
  label: label.nullable().optional(),
  symptoms: diseaseTexts.symptoms.optional(),
  what: diseaseTexts.what.optional(),
  action: diseaseTexts.action.optional(),
})
export type DiseaseCreate = z.infer<typeof diseaseCreate>
export type DiseaseUpdate = z.infer<typeof diseaseUpdate>
export type Disease = {
  id: number
  plantId: number
  title: string
  label: string | null
  symptoms: string | null
  what: string | null
  action: string | null
}

/* ─────────────── Admin dashboard: a plant with all its details in one save ─────────────── */

/** With id: an existing row (updated); without: a new row. A row left out of the list is deleted. */
const childId = entityId.optional()

/** Stages in tab order (seed, plant, care): the error points at the first stage that is out of order */
const tabsInOrder = (rows: { tab: LifecycleTab }[], ctx: z.RefinementCtx) => {
  const order = (tab: LifecycleTab) => LIFECYCLE_TABS.indexOf(tab)
  const late = rows.findIndex((row, i) => i > 0 && order(row.tab) < order(rows[i - 1].tab))
  if (late >= 0) ctx.addIssue({ code: 'custom', message: 'Stages go in tab order: seed, plant, care', path: [late, 'tab'] })
}

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
 * the order of lifecycles and imageIds is their position. The description and each «Τι να
 * προσέχεις» text are formatted texts from the editor (rich-text.ts, no photos); they are stored as
 * JSON text, and readers parse them with parseRichContent (older plain texts still read fine).
 */
export const plantSave = plantFields
  .extend({
    description: optionalRichText,
    lifecycles: z
      .array(z.object({ id: childId, title, content: text, tab: z.enum(LIFECYCLE_TABS), duration: duration.nullable() }))
      .max(50)
      .superRefine(tabsInOrder),
    diseases: z
      .array(
        z
          .object({
            id: childId,
            title,
            label: label.nullable(),
            symptoms: optionalRichText,
            what: optionalRichText,
            action: optionalRichText,
          })
          .refine(hasDiseaseText, diseaseTextMessage),
      )
      .max(50),
  })
  .refine(intenseInOrder, barMessage('sunIntenseEnd'))
  .refine(softInOrder, barMessage('sunSoftEnd'))
  .refine(lifespanInOrder, lifespanMessage)
  .refine(placed, placedMessage)

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
