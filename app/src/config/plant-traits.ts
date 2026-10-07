import { stripBlogLinks } from '@growme/shared';

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
const MONTH_ABBREVIATIONS = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ'];

const SEASONS = [
  { emoji: '❄️', months: [12, 1, 2] },
  { emoji: '🌷', months: [3, 4, 5] },
  { emoji: '☀️', months: [6, 7, 8] },
  { emoji: '🍂', months: [9, 10, 11] },
];
const ALL_YEAR_EMOJI = '📅';

const monthsInRange = ([from, to]: [number, number]) => {
  const months = [from];
  for (let month = from; month !== to; month = (month % 12) + 1) months.push((month % 12) + 1);
  return months;
};

// Label like "ΦΕΒ – ΝΟΕ", and the icon of the season covering most of the range
// (ties go to the season the range starts in; 10+ months counts as all year)
export function plantingPeriod(range: [number, number]): Trait {
  const months = monthsInRange(range);
  const label = `${MONTH_ABBREVIATIONS[range[0] - 1]} – ${MONTH_ABBREVIATIONS[range[1] - 1]}`;
  if (months.length >= 10) return { emoji: ALL_YEAR_EMOJI, label };

  const firstSeason = SEASONS.find((season) => season.months.includes(range[0]))!;
  const best = SEASONS.reduce((top, season) => {
    const count = months.filter((month) => season.months.includes(month)).length;
    const topCount = months.filter((month) => top.months.includes(month)).length;
    return count > topCount ? season : top;
  }, firstSeason);
  return { emoji: best.emoji, label };
}

/* ─────────────── From the database's plant fields (see @growme/shared PlantSummary) ─────────────── */

type PlantFields = {
  priceMin: number | null;
  priceMax: number | null;
  difficulty: number;
  sunlightHoursMin: number | null;
  sunlightHoursMax: number | null;
  monthStart: number | null;
  monthEnd: number | null;
  food: string | null;
  seeds: string | null;
  native: string | null;
};

const euros = (cents: number) => (cents / 100).toLocaleString('el-GR', { maximumFractionDigits: 2 });

/** "3–6 €", "3 €" or "από 3 €"; null without a price */
export function priceLabel({ priceMin: min, priceMax: max }: PlantFields): string | null {
  if (min != null && max != null) return min === max ? `${euros(min)} €` : `${euros(min)}–${euros(max)} €`;
  if (min != null) return `από ${euros(min)} €`;
  if (max != null) return `έως ${euros(max)} €`;
  return null;
}

/** Sun from the daily sun hours (the fewest it needs): 6+ full sun, 3–5 partial shade, less shade */
export function sunlightTrait({ sunlightHoursMin: min, sunlightHoursMax: max }: PlantFields): Trait | null {
  const hours = min ?? max;
  if (hours == null) return null;
  if (hours >= 6) return SUNLIGHT['full-sun'];
  return hours >= 3 ? SUNLIGHT['partial-shade'] : SUNLIGHT.shade;
}

/** "6–8 ώρες ήλιου"; null when not set */
export function sunlightHoursLabel({ sunlightHoursMin: min, sunlightHoursMax: max }: PlantFields): string | null {
  if (min == null && max == null) return null;
  const hours = min != null && max != null && min !== max ? `${min}–${max}` : String(min ?? max);
  return `${hours} ώρες ήλιου τη μέρα`;
}

/** Difficulty 1–5: 1–2 easy, 3 moderate, 4–5 hard */
export const effortTrait = ({ difficulty }: PlantFields): Trait =>
  difficulty <= 2 ? EFFORT.easy : difficulty === 3 ? EFFORT.moderate : EFFORT.expert;

// food / seeds / native are short texts written in the dashboard (e.g. «Τρώγεται ο καρπός»); empty = not shown.
// Labels may hold blog links (`[words](blog:12)`): pages render them with LinkedText, cards strip them.

/** e.g. 🍅 Τρώγεται ο καρπός */
export const useTrait = ({ food }: PlantFields): Trait | null => (food ? { emoji: '🍅', label: food } : null);

/** e.g. 🌰 Από σπόρο (🪴 for «Από φυτό») */
export const propagationTrait = ({ seeds }: PlantFields): Trait | null =>
  seeds ? { emoji: stripBlogLinks(seeds) === 'Από φυτό' ? '🪴' : '🌰', label: seeds } : null;

/** e.g. 📍 Ιθαγενές της Μεσογείου */
export const originTrait = ({ native }: PlantFields): Trait | null => (native ? { emoji: '📍', label: native } : null);

/** The planting season label and icon; null when the months aren't set */
export const seasonTrait = ({ monthStart, monthEnd }: PlantFields): Trait | null =>
  monthStart != null && monthEnd != null ? plantingPeriod([monthStart, monthEnd]) : null;
