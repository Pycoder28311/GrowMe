import {
  monthsOfRange,
  sunLength,
  type MonthRange,
  type PlantSummary,
} from "@growme/shared";

// How each plant characteristic is shown on a card: an emoji and a short Greek label

export type Trait = { emoji: string; label: string };

export const SUNLIGHT: Record<string, Trait> = {
  "full-sun": { emoji: "☀️", label: "Ήλιος" },
  "partial-shade": { emoji: "⛅", label: "Ημισκιά" },
  shade: { emoji: "☁️", label: "Σκιά" },
};

// How much work the owner has to put in
export const EFFORT: Record<string, Trait> = {
  easy: { emoji: "🌱", label: "Εύκολο" },
  moderate: { emoji: "🧤", label: "Μέτριο" },
  expert: { emoji: "🧑‍🌾", label: "Δύσκολο" },
};

// Planting period, stored as months [from, to] (1 = January). Ranges may wrap past December, e.g. [9, 3].
const MONTH_ABBREVIATIONS = [
  "ΙΑΝ",
  "ΦΕΒ",
  "ΜΑΡ",
  "ΑΠΡ",
  "ΜΑΪ",
  "ΙΟΥΝ",
  "ΙΟΥΛ",
  "ΑΥΓ",
  "ΣΕΠ",
  "ΟΚΤ",
  "ΝΟΕ",
  "ΔΕΚ",
];

const SEASONS = [
  { emoji: "❄️", months: [12, 1, 2] },
  { emoji: "🌷", months: [3, 4, 5] },
  { emoji: "☀️", months: [6, 7, 8] },
  { emoji: "🍂", months: [9, 10, 11] },
];
const ALL_YEAR_EMOJI = "📅";

// Label like "ΦΕΒ – ΝΟΕ", and the icon of the season covering most of the range
// (ties go to the season the range starts in; 10+ months counts as all year)
export function plantingPeriod(range: MonthRange): Trait {
  const months = monthsOfRange(range);
  const label = `${MONTH_ABBREVIATIONS[range[0] - 1]} – ${MONTH_ABBREVIATIONS[range[1] - 1]}`;
  if (months.length >= 10) return { emoji: ALL_YEAR_EMOJI, label };

  const firstSeason = SEASONS.find((season) =>
    season.months.includes(range[0]),
  )!;
  const best = SEASONS.reduce((top, season) => {
    const count = months.filter((month) =>
      season.months.includes(month),
    ).length;
    const topCount = months.filter((month) =>
      top.months.includes(month),
    ).length;
    return count > topCount ? season : top;
  }, firstSeason);
  return { emoji: best.emoji, label };
}

/* ─────────────── From the database's plant fields (see @growme/shared PlantSummary) ─────────────── */

type PlantFields = Pick<
  PlantSummary,
  | "priceMin"
  | "priceMax"
  | "difficulty"
  | "sunStart"
  | "sunEnd"
  | "monthRanges"
  | "food"
  | "native"
>;

const euros = (cents: number) =>
  (cents / 100).toLocaleString("el-GR", { maximumFractionDigits: 2 });

/** "3–6 €", "3 €" or "από 3 €"; null without a price */
export function priceLabel({
  priceMin: min,
  priceMax: max,
}: PlantFields): string | null {
  if (min != null && max != null)
    return min === max ? `${euros(min)} €` : `${euros(min)}–${euros(max)} €`;
  if (min != null) return `από ${euros(min)} €`;
  if (max != null) return `έως ${euros(max)} €`;
  return null;
}

/** Sun from the length of its sun window: 6+ hours full sun, 3–5 partial shade, less shade */
export function sunlightTrait({ sunStart, sunEnd }: PlantFields): Trait | null {
  const hours = sunLength(sunStart, sunEnd);
  if (hours == null) return null;
  if (hours >= 6) return SUNLIGHT["full-sun"];
  return hours >= 3 ? SUNLIGHT["partial-shade"] : SUNLIGHT.shade;
}

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** "6 ώρες ήλιου (10:00–16:00)"; null when not set */
export function sunlightHoursLabel({
  sunStart,
  sunEnd,
}: PlantFields): string | null {
  const hours = sunLength(sunStart, sunEnd);
  if (hours == null) return null;
  return `${hours} ${hours === 1 ? "ώρα" : "ώρες"} ήλιου (${clock(sunStart!)}–${clock(sunEnd!)})`;
}

/** Difficulty: 1 easy, 2 moderate, 3 hard */
export const effortTrait = ({ difficulty }: PlantFields): Trait =>
  difficulty === 1
    ? EFFORT.easy
    : difficulty === 2
      ? EFFORT.moderate
      : EFFORT.expert;

/** 🍅 Φαγώσιμο, when it is edible */
export const useTrait = ({ food }: PlantFields): Trait | null =>
  food ? { emoji: "🍅", label: "Φαγώσιμο" } : null;

// native is a short text written in the dashboard (e.g. «Ιθαγενές της Μεσογείου»); empty = not shown.
// It may hold blog links (`[words](blog:12)`): pages render them with LinkedText, cards strip them.

/** e.g. 📍 Ιθαγενές της Μεσογείου */
export const originTrait = ({ native }: PlantFields): Trait | null =>
  native ? { emoji: "📍", label: native } : null;

/** The planting seasons' label (several joined) and the first one's icon; null when none is set */
export function seasonTrait({ monthRanges }: PlantFields): Trait | null {
  if (monthRanges.length === 0) return null;
  const periods = monthRanges.map(plantingPeriod);
  return {
    emoji: periods[0].emoji,
    label: periods.map((period) => period.label).join(", "),
  };
}
