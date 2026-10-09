// A plant's fixed choices (difficulty, wind, kind, size, flags) with their Greek words, and the small
// helpers that read its sun window, month ranges and durations. The dashboard, the app's plant page
// and its filters all use these, so a new flag or choice is added here once.

/* ─────────────── Choices ─────────────── */

/** Difficulty: 1 easy, 2 medium, 3 hard */
export const DIFFICULTIES = [1, 2, 3] as const
export type Difficulty = (typeof DIFFICULTIES)[number]
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { 1: 'Εύκολο', 2: 'Μέτριο', 3: 'Δύσκολο' }

/** How much wind a plant takes, strongest first */
export const WIND_LEVELS = ['strong', 'moderate', 'light', 'sheltered'] as const
export type WindLevel = (typeof WIND_LEVELS)[number]
export const WIND_LABELS: Record<WindLevel, string> = {
  strong: 'Αντέχει δυνατό αέρα',
  moderate: 'Αντέχει μέτριο αέρα',
  light: 'Λίγο αέρα',
  sheltered: 'Θέλει προστατευμένο σημείο',
}
/** What the short filter's «Αντέχει αέρα» means */
export const WIND_TOLERANT: readonly WindLevel[] = ['strong', 'moderate']

export const PLANT_KINDS = ['flowers', 'leaves', 'bush'] as const
export type PlantKind = (typeof PLANT_KINDS)[number]
export const PLANT_KIND_LABELS: Record<PlantKind, string> = { flowers: 'Ανθοφόρο', leaves: 'Φυλλώδες', bush: 'Θάμνος' }

export const PLANT_SIZES = ['small', 'medium', 'large'] as const
export type PlantSize = (typeof PLANT_SIZES)[number]
export const PLANT_SIZE_LABELS: Record<PlantSize, string> = { small: 'Μικρό', medium: 'Μεσαίο', large: 'Μεγάλο' }

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
  { key: 'privacy', label: 'Ιδιωτικότητα (φράχτης)', emoji: '🏡', yes: 'Ιδιωτικότητα', no: null },
  { key: 'nearSea', label: 'Κοντά στη θάλασσα', emoji: '🌊', yes: 'Κοντά στη θάλασσα', no: null },
  { key: 'frostHardy', label: 'Αντέχει τον παγετό', emoji: '❄️', yes: 'Ανθεκτικό στον παγετό', no: null },
] as const satisfies readonly { key: string; label: string; emoji: string; yes: string | null; no: string | null }[]

export type PlantFlag = (typeof PLANT_FLAGS)[number]['key']
export const PLANT_FLAG_KEYS = PLANT_FLAGS.map((f) => f.key) as PlantFlag[]
export type PlantFlags = Record<PlantFlag, boolean>

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

/* ─────────────── Sun window (clock hours 0–24) ─────────────── */

export type SunPart = 'morning' | 'noon' | 'afternoon'
export const SUN_PART_LABELS: Record<SunPart, string> = {
  morning: 'Πρωινός ήλιος',
  noon: 'Μεσημεριανός ήλιος',
  afternoon: 'Απογευματινός ήλιος',
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

/* ─────────────── Month ranges ─────────────── */

/** [from, to] months, 1 = January; may wrap past December (e.g. [11, 2]) */
export type MonthRange = [number, number]

/** At most this many ranges per plant */
export const MAX_MONTH_RANGES = 3

/** Every month in a range, in order: [11, 2] → [11, 12, 1, 2] */
export function monthsOfRange([from, to]: MonthRange): number[] {
  const months = [from]
  for (let month = from; month !== to; month = (month % 12) + 1) months.push((month % 12) + 1)
  return months
}

/** Whether any of the ranges includes the month */
export const rangesCoverMonth = (ranges: readonly MonthRange[], month: number) =>
  ranges.some((range) => monthsOfRange(range).includes(month))
