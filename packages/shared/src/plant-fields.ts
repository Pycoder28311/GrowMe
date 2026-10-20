// A plant's fixed choices (difficulty, pot sizes, tolerance levels, flags...) with their Greek words, and
// the small helpers that read its sun bars, seasons, lifespan and durations. The dashboard, the app's plant page
// and its filters all use these, so a new flag or choice is added here once.

/* ─────────────── Choices ─────────────── */

/** How much effort a plant asks (difficulty, time needed): the same three levels */
export const EFFORT_LEVELS = ['small', 'medium', 'big'] as const
export type EffortLevel = (typeof EFFORT_LEVELS)[number]
export const DIFFICULTY_LABELS: Record<EffortLevel, string> = { small: 'Εύκολο', medium: 'Μέτριο', big: 'Δύσκολο' }
export const TIME_NEEDED_LABELS: Record<EffortLevel, string> = { small: 'Λίγος χρόνος', medium: 'Μέτριος χρόνος', big: 'Πολύς χρόνος' }

/** Pot sizes by diameter (cm): small <20, medium 21–35, big 36–50, large >50 */
export const POT_SIZES = ['small', 'medium', 'big', 'large'] as const
export type PotSize = (typeof POT_SIZES)[number]
export const POT_SIZE_LABELS: Record<PotSize, string> = {
  small: 'Μικρή (<20 cm)',
  medium: 'Μεσαία (21–35 cm)',
  big: 'Μεγάλη (36–50 cm)',
  large: 'Πολύ μεγάλη (>50 cm)',
}

/** Who a plant is toxic to; `none` = safe for both */
export const TOXICITY = ['cat', 'dog', 'none'] as const
export type Toxicity = (typeof TOXICITY)[number]
export const TOXICITY_LABELS: Record<Toxicity, string> = { cat: 'Γάτες', dog: 'Σκύλοι', none: 'Κανένα' }

/** How much frost, sea salt or wind a plant tolerates (null = not set); the page shows medium and big */
export const TOLERANCE_LEVELS = ['small', 'medium', 'big'] as const
export type ToleranceLevel = (typeof TOLERANCE_LEVELS)[number]
export const TOLERANCE_LABELS: Record<ToleranceLevel, string> = { small: 'Λίγο', medium: 'Μέτρια', big: 'Πολύ' }
export const TOLERANCES = [
  { key: 'frostTolerance', label: 'Παγετός' },
  { key: 'saltTolerance', label: 'Αλατονέφος' },
  { key: 'windTolerance', label: 'Αέρας' },
] as const
export type ToleranceKey = (typeof TOLERANCES)[number]['key']

/** The tabs of the lifecycle: stages from seed, stages from a ready plant, care */
export const LIFECYCLE_TABS = ['seed', 'plant', 'care'] as const
export type LifecycleTab = (typeof LIFECYCLE_TABS)[number]
export const LIFECYCLE_TAB_LABELS: Record<LifecycleTab, string> = { seed: 'Από σπόρο', plant: 'Μεταφύτευση', care: 'Περιποίηση' }

/* ─────────────── Yes/no flags ─────────────── */

/**
 * Every yes/no field of a plant: its dashboard label, and what the user sees when it is yes or no
 * (null = nothing shown). The key is the API field (and, in snake case, the column).
 */
export const PLANT_FLAGS = [
  { key: 'food', label: 'Βρώσιμο', emoji: '🍅', yes: 'Φαγώσιμο', no: 'Μη φαγώσιμο' },
  { key: 'aromatic', label: 'Αρωματικό', emoji: '🌿', yes: 'Αρωματικό', no: null },
  { key: 'climbing', label: 'Αναρριχητικό', emoji: '🧗', yes: 'Αναρριχητικό', no: null },
  { key: 'ornamental', label: 'Καλλωπιστικό', emoji: '🌸', yes: 'Καλλωπιστικό', no: null },
  { key: 'succulent', label: 'Παχύφυτο', emoji: '🌵', yes: 'Παχιά φύλλα', no: 'Λεπτά φύλλα' },
  { key: 'smallTree', label: 'Μικρό δέντρο', emoji: '🌳', yes: null, no: null },
  { key: 'greenness', label: 'Πρασινάδα', emoji: '🌱', yes: 'Πρασινάδα', no: null },
  { key: 'evergreen', label: 'Πράσινο όλο το χρόνο', emoji: '🌲', yes: 'Πράσινο όλο το χρόνο', no: null },
  { key: 'privacy', label: 'Ιδιωτικότητα (φράχτης)', emoji: '🏡', yes: 'Ιδιωτικότητα', no: null },
  { key: 'indoor', label: 'Εσωτερικός χώρος', emoji: '🏠', yes: null, no: null },
  { key: 'outdoor', label: 'Εξωτερικός χώρος', emoji: '🌤️', yes: null, no: null },
] as const satisfies readonly { key: string; label: string; emoji: string; yes: string | null; no: string | null }[]

export type PlantFlag = (typeof PLANT_FLAGS)[number]['key']
export const PLANT_FLAG_KEYS = PLANT_FLAGS.map((f) => f.key) as PlantFlag[]
export type PlantFlags = Record<PlantFlag, boolean>

/** The exterior filter's usage checkboxes */
export const PLANT_USAGE_FLAGS = ['food', 'climbing', 'aromatic', 'ornamental', 'smallTree', 'greenness', 'succulent'] as const satisfies readonly PlantFlag[]

/** The flags that are yes unless the dashboard says otherwise (every other one starts as no) */
export const PLANT_FLAGS_YES_BY_DEFAULT: readonly PlantFlag[] = ['indoor', 'outdoor']
export const flagDefault = (key: PlantFlag) => PLANT_FLAGS_YES_BY_DEFAULT.includes(key)

/** What the user sees for one flag, or null when nothing is shown */
export function flagPhrase(key: PlantFlag, value: boolean): string | null {
  const flag = PLANT_FLAGS.find((f) => f.key === key)!
  return value ? flag.yes : flag.no
}

/** The flags a plant page shows, in PLANT_FLAGS order */
export function visibleFlags(plant: PlantFlags): { key: PlantFlag; emoji: string; label: string }[] {
  return PLANT_FLAGS.flatMap((f) => {
    const label = flagPhrase(f.key, plant[f.key])
    return label ? [{ key: f.key, emoji: f.emoji, label }] : []
  })
}

/* ─────────────── Durations («4-6 weeks») ─────────────── */

export const DURATION_UNITS = ['days', 'weeks', 'months', 'years'] as const
export type DurationUnit = (typeof DURATION_UNITS)[number]
export const DURATION_UNIT_LABELS: Record<DurationUnit, { one: string; many: string }> = {
  days: { one: 'μέρα', many: 'μέρες' },
  weeks: { one: 'εβδομάδα', many: 'εβδομάδες' },
  months: { one: 'μήνας', many: 'μήνες' },
  years: { one: 'χρόνος', many: 'χρόνια' },
}

/** A lifespan or a stage's time: «2 years» (to null) or «4-6 weeks» */
export type Duration = { from: number; to: number | null; unit: DurationUnit }

const DURATION = /^(\d{1,4})(?:-(\d{1,4}))? (days|weeks|months|years)$/

/** «4-6 weeks» → { from: 4, to: 6, unit: 'weeks' }; null when it isn't one (numbers 1–9999, from < to) */
export function parseDuration(text: string): Duration | null {
  const match = DURATION.exec(text.trim())
  if (!match) return null
  const from = Number(match[1])
  const to = match[2] === undefined ? null : Number(match[2])
  if (from < 1 || (to !== null && to <= from)) return null
  return { from, to, unit: match[3] as DurationUnit }
}

/** Back to the stored text: «4-6 weeks» */
export const formatDuration = ({ from, to, unit }: Duration) => `${to === null ? from : `${from}-${to}`} ${unit}`

/** «4–6 εβδομάδες», «1 χρόνος»; null when empty or not a duration */
export function durationLabel(text: string | null | undefined): string | null {
  const d = text ? parseDuration(text) : null
  if (!d) return null
  const words = DURATION_UNIT_LABELS[d.unit]
  return d.to === null ? `${d.from} ${d.from === 1 ? words.one : words.many}` : `${d.from}–${d.to} ${words.many}`
}

/* ─────────────── Sun bars (clock hours 6–21) ─────────────── */

export const SUN_MIN_HOUR = 6
export const SUN_MAX_HOUR = 21

/** A plant has two bars: hours of intense sun and hours of soft (non-intense) light */
export const SUN_BARS = [
  { key: 'intense', label: 'Έντονο φως', start: 'sunIntenseStart', end: 'sunIntenseEnd' },
  { key: 'soft', label: 'Απαλό φως', start: 'sunSoftStart', end: 'sunSoftEnd' },
] as const
export type SunBarKey = (typeof SUN_BARS)[number]['key']
export type SunBar = { start: number; end: number }
export type SunFields = Record<(typeof SUN_BARS)[number]['start' | 'end'], number | null>

export type SunPart = 'morning' | 'noon' | 'afternoon'
export const SUN_PART_LABELS: Record<SunPart, string> = {
  morning: 'Πρωινός ήλιος',
  noon: 'Μεσημεριανός ήλιος',
  afternoon: 'Απογευματινός ήλιος',
}

/** One bar of a plant, or null when it isn't set */
export function sunBar(plant: SunFields, key: SunBarKey): SunBar | null {
  const bar = SUN_BARS.find((b) => b.key === key)!
  const start = plant[bar.start]
  const end = plant[bar.end]
  return start === null || end === null ? null : { start, end }
}

/** Hours of sun in a window; null when it isn't set */
export const sunLength = (start: number | null, end: number | null) =>
  start === null || end === null ? null : end - start

/** Which part of the day a window mostly lights, from its middle: before 11 morning, to 15 noon */
export function sunPart(start: number, end: number): SunPart {
  const middle = (start + end) / 2
  if (middle < 11) return 'morning'
  return middle <= 15 ? 'noon' : 'afternoon'
}

/* ─────────────── Lifespan (whole years) ─────────────── */

/** «4–6 χρόνια», «1 χρόνος»; null when not set */
export function lifespanLabel(min: number | null, max: number | null): string | null {
  if (min === null || max === null) return null
  return min === max ? `${min} ${min === 1 ? 'χρόνος' : 'χρόνια'}` : `${min}–${max} χρόνια`
}

/* ─────────────── Month ranges ─────────────── */

/** [from, to] months, 1 = January; may wrap past December (e.g. [11, 2]) */
export type MonthRange = [number, number]

/** At most this many ranges per season */
export const MAX_MONTH_RANGES = 3

/** The four seasons and their months (12 = December) */
export const SEASONS = [
  { id: 'winter', label: 'Χειμώνας', months: [12, 1, 2] },
  { id: 'spring', label: 'Άνοιξη', months: [3, 4, 5] },
  { id: 'summer', label: 'Καλοκαίρι', months: [6, 7, 8] },
  { id: 'autumn', label: 'Φθινόπωρο', months: [9, 10, 11] },
] as const
export type SeasonId = (typeof SEASONS)[number]['id']

/** A plant's seasons, each up to MAX_MONTH_RANGES ranges */
export const SEASON_FIELDS = ['seedingSeason', 'plantingSeason'] as const
export type SeasonField = (typeof SEASON_FIELDS)[number]
export const SEASON_LABELS: Record<SeasonField, string> = { seedingSeason: 'Σπορά', plantingSeason: 'Φύτεμα' }
export type PlantSeasons = Record<SeasonField, MonthRange[]>

/** Every month in a range, in order: [11, 2] → [11, 12, 1, 2] */
export function monthsOfRange([from, to]: MonthRange): number[] {
  const months = [from]
  for (let month = from; month !== to; month = (month % 12) + 1) months.push((month % 12) + 1)
  return months
}

/** Whether any of the ranges includes the month */
export const rangesCoverMonth = (ranges: readonly MonthRange[], month: number) =>
  ranges.some((range) => monthsOfRange(range).includes(month))
