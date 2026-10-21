import {
  EFFORT_LEVELS,
  monthsOfRange,
  sunBar,
  sunLength,
  type MonthRange,
  type PlantSummary,
} from '@growme/shared';

// How each plant characteristic is shown on a card: an emoji and a short Greek label

export type Trait = { emoji: string; label: string };

export const SUNLIGHT: Record<string, Trait> = {
  'full-sun': { emoji: '☀️', label: 'Ήλιος' },
  'partial-shade': { emoji: '⛅', label: 'Ημισκιά' },
  shade: { emoji: '☁️', label: 'Σκιά' },
};

// How much work the owner has to put in
export const EFFORT: Record<string, Trait> = {
  easy: { emoji: '🌱', label: 'Εύκολο' },
  moderate: { emoji: '🧤', label: 'Μέτριο' },
  expert: { emoji: '🧑‍🌾', label: 'Δύσκολο' },
};

// Planting period, stored as months [from, to] (1 = January). Ranges may wrap past December, e.g. [9, 3].
const MONTH_ABBREVIATIONS = [
  'ΙΑΝ',
  'ΦΕΒ',
  'ΜΑΡ',
  'ΑΠΡ',
  'ΜΑΪ',
  'ΙΟΥΝ',
  'ΙΟΥΛ',
  'ΑΥΓ',
  'ΣΕΠ',
  'ΟΚΤ',
  'ΝΟΕ',
  'ΔΕΚ',
];

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

const SEASONS: { key: Season; emoji: string; months: number[] }[] = [
  { key: 'winter', emoji: '❄️', months: [12, 1, 2] },
  { key: 'spring', emoji: '🌷', months: [3, 4, 5] },
  { key: 'summer', emoji: '☀️', months: [6, 7, 8] },
  { key: 'autumn', emoji: '🍂', months: [9, 10, 11] },
];
const ALL_YEAR_EMOJI = '📅';

/**
 * The season covering most of a range (ties go to the season the range starts in), or 'all' for
 * 10+ months
 */
export function rangeSeason(range: MonthRange): Season | 'all' {
  const months = monthsOfRange(range);
  if (months.length >= 10) return 'all';
  const firstSeason = SEASONS.find((season) => season.months.includes(range[0]))!;
  const covered = (season: (typeof SEASONS)[number]) => months.filter((month) => season.months.includes(month)).length;
  return SEASONS.reduce((top, season) => (covered(season) > covered(top) ? season : top), firstSeason).key;
}

// Label like 'ΦΕΒ – ΝΟΕ', and the icon of its season (rangeSeason)
export function plantingPeriod(range: MonthRange): Trait {
  const label = `${MONTH_ABBREVIATIONS[range[0] - 1]} – ${MONTH_ABBREVIATIONS[range[1] - 1]}`;
  const season = rangeSeason(range);
  return { emoji: season === 'all' ? ALL_YEAR_EMOJI : SEASONS.find((s) => s.key === season)!.emoji, label };
}

/* ─────────────── From the database's plant fields (see @growme/shared PlantSummary) ─────────────── */

type PlantFields = Pick<
  PlantSummary,
  | 'difficultyLevels'
  | 'sunIntenseStart'
  | 'sunIntenseEnd'
  | 'sunSoftStart'
  | 'sunSoftEnd'
  | 'plantingSeason'
  | 'food'
  | 'native'
>;

/** Sun from the length of its intense-sun bar: 6+ hours full sun, 3–5 partial shade, less shade; null without a bar */
export function sunlightTrait(plant: PlantFields): Trait | null {
  const bar = sunBar(plant, 'intense');
  const hours = bar && sunLength(bar.start, bar.end);
  if (hours == null) return null;
  if (hours >= 6) return SUNLIGHT['full-sun'];
  return hours >= 3 ? SUNLIGHT['partial-shade'] : SUNLIGHT.shade;
}

/** Difficulty: the hardest level the plant is marked with (easy, moderate, hard); null when none is set */
export function effortTrait({ difficultyLevels }: PlantFields): Trait | null {
  const hardest = Math.max(-1, ...difficultyLevels.map((level) => EFFORT_LEVELS.indexOf(level)));
  return hardest < 0 ? null : [EFFORT.easy, EFFORT.moderate, EFFORT.expert][hardest];
}

/** 🍅 Φαγώσιμο, when it is edible */
export const useTrait = ({ food }: PlantFields): Trait | null =>
  food ? { emoji: '🍅', label: 'Φαγώσιμο' } : null;

// native is a short text written in the dashboard (e.g. «Ιθαγενές της Μεσογείου»); empty = not shown.
// It may hold blog links (`[words](blog:12)`): pages render them with LinkedText, cards strip them.

/** e.g. 📍 Ιθαγενές της Μεσογείου */
export const originTrait = ({ native }: PlantFields): Trait | null =>
  native ? { emoji: '📍', label: native } : null;
