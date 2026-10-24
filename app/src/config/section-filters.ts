import {
  DIFFICULTY_LABELS,
  EFFORT_LEVELS,
  PLANT_FLAGS,
  PLANT_USAGE_FLAGS,
  POT_SIZE_LABELS,
  POT_SIZES,
  rangesCoverMonth,
  SEASONS,
  SUN_MAX_HOUR,
  SUN_MIN_HOUR,
  sunBar,
  TIME_NEEDED_LABELS,
  TOXICITY,
  TOXICITY_LABELS,
  type SearchPlant,
  type SunBarKey,
} from '@growme/shared';

// Every filter of the results page's two sections (indoor and outdoor plants), defined once as data: the
// filter sheets render it, and lib/plant-filter-match.ts applies it to the search index's plants, on the
// phone. A new filter is one entry in FILTERS (no component changes). No React Native code here.

export type SectionId = 'indoor' | 'outdoor';

/** What a filter reads: a plant of the search index */
export type FilterPlant = SearchPlant;

/** [from, to] in clock hours (or any whole numbers) */
export type Range = readonly [number, number];

export type FilterOption = { id: string; label: string; test: (plant: FilterPlant) => boolean };

type FilterBase = {
  /** The key of its choice in a Selection */
  key: string;
  label: string;
  /** The sections this filter appears in */
  sections: readonly SectionId[];
  /** A heading shared by several filters in the sheet (shown once, before the first of them) */
  group?: string;
  /** Also in the home screen's short set */
  quick?: boolean;
};

/** Options to tap; a plant passes when it passes any chosen option */
export type ChipFilter = FilterBase & {
  kind: 'chips';
  /** one: a single choice (tap it again to clear); many: any number */
  select: 'one' | 'many';
  options: FilterOption[];
  /** Choosing here empties these filters (e.g. the two seasons) */
  clears?: readonly string[];
  /** An option that excludes the others, and the others exclude it (toxicity «none») */
  exclusive?: string;
};

/** A bar with two thumbs and two inputs; a plant passes when `test` says so for the chosen range */
export type RangeFilter = FilterBase & {
  kind: 'range';
  min: number;
  max: number;
  ticks: number[];
  test: (plant: FilterPlant, range: Range) => boolean;
};

export type PlantFilter = ChipFilter | RangeFilter;

/** What is chosen, by filter key: option ids for chips, a range for a bar */
export type Selection = Record<string, readonly string[] | Range>;

/* ─────────────── Helpers for the entries ─────────────── */

const optionsFrom = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
  test: (plant: FilterPlant, value: T) => boolean,
): FilterOption[] => values.map((value) => ({ id: value, label: labels[value], test: (plant) => test(plant, value) }));

/** The four seasons; a plant passes when any of its ranges in `field` reaches a month of the season */
const seasonOptions = (field: 'seedingSeason' | 'plantingSeason'): FilterOption[] =>
  SEASONS.map((season) => ({
    id: season.id,
    label: season.label,
    test: (plant) => season.months.some((month) => rangesCoverMonth(plant[field], month)),
  }));

const flagLabel = (key: (typeof PLANT_FLAGS)[number]['key']) => PLANT_FLAGS.find((flag) => flag.key === key)!.label;

/** Sun: the plant's bar lies inside the range; a plant without that bar doesn't pass */
const sunTest = (kind: SunBarKey) => (plant: FilterPlant, [from, to]: Range) => {
  const bar = sunBar(plant, kind);
  return bar !== null && bar.start >= from && bar.end <= to;
};

const SUN_TICKS = [6, 9, 12, 15, 18, 21];
const SUN_GROUP = 'Φως (από τις 6 το πρωί έως τις 9 το βράδυ)';
const BOTH: readonly SectionId[] = ['indoor', 'outdoor'];

/* ─────────────── The filters, in the order they show in the sheet ─────────────── */

export const FILTERS: readonly PlantFilter[] = [
  {
    kind: 'range',
    key: 'sunIntense',
    label: 'Έντονο φως',
    group: SUN_GROUP,
    sections: BOTH,
    quick: true,
    min: SUN_MIN_HOUR,
    max: SUN_MAX_HOUR,
    ticks: SUN_TICKS,
    test: sunTest('intense'),
  },
  {
    kind: 'range',
    key: 'sunSoft',
    label: 'Μη έντονο φως',
    group: SUN_GROUP,
    sections: BOTH,
    min: SUN_MIN_HOUR,
    max: SUN_MAX_HOUR,
    ticks: SUN_TICKS,
    test: sunTest('soft'),
  },
  {
    kind: 'chips',
    key: 'pot',
    label: 'Μέγεθος γλάστρας (διάμετρος)',
    sections: BOTH,
    select: 'many',
    quick: true,
    options: optionsFrom(POT_SIZES, POT_SIZE_LABELS, (p, v) => p.potSizes.includes(v)),
  },
  {
    kind: 'chips',
    key: 'difficulty',
    label: 'Δυσκολία',
    sections: BOTH,
    select: 'many',
    quick: true,
    options: optionsFrom(EFFORT_LEVELS, DIFFICULTY_LABELS, (p, v) => p.difficultyLevels.includes(v)),
  },
  {
    kind: 'chips',
    key: 'time',
    label: 'Χρόνος φροντίδας',
    sections: BOTH,
    select: 'many',
    options: optionsFrom(EFFORT_LEVELS, TIME_NEEDED_LABELS, (p, v) => p.timeNeeded.includes(v)),
  },
  {
    kind: 'chips',
    key: 'toxicity',
    label: 'Τοξικότητα (για ποιο ζώο)',
    sections: BOTH,
    select: 'many',
    exclusive: 'none',
    options: optionsFrom(TOXICITY, TOXICITY_LABELS, (p, v) => p.toxicity.includes(v)),
  },
  {
    kind: 'chips',
    key: 'usage',
    label: 'Χρήση',
    sections: ['outdoor'],
    select: 'many',
    options: PLANT_USAGE_FLAGS.map((key) => ({ id: key, label: flagLabel(key), test: (p) => p[key] })),
  },
  {
    kind: 'chips',
    key: 'seeding',
    label: 'Εποχή σποράς',
    sections: ['outdoor'],
    select: 'many',
    clears: ['planting'],
    options: seasonOptions('seedingSeason'),
  },
  {
    kind: 'chips',
    key: 'planting',
    label: 'Εποχή φύτευσης',
    sections: ['outdoor'],
    select: 'many',
    clears: ['seeding'],
    options: seasonOptions('plantingSeason'),
  },
  {
    kind: 'chips',
    key: 'green',
    label: 'Πρασινάδα (αν είναι πράσινο όλο τον χρόνο)',
    sections: BOTH,
    select: 'one',
    options: [
      { id: 'yes', label: 'Όλο τον χρόνο', test: (p) => p.evergreen },
      { id: 'no', label: 'Μέρος του χρόνου', test: (p) => !p.evergreen },
    ],
  },
];

export const filtersFor = (section: SectionId) => FILTERS.filter((filter) => filter.sections.includes(section));

/** The short set of the home screen's sheet */
export const QUICK_FILTERS = FILTERS.filter((filter) => filter.quick);

/** Nothing chosen: no options in the chip filters, the whole bar in the range ones */
export const NO_FILTERS: Selection = Object.fromEntries(
  FILTERS.map((filter) => [filter.key, filter.kind === 'range' ? ([filter.min, filter.max] as Range) : []]),
);
