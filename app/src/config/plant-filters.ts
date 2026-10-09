import {
  PLANT_FLAGS,
  PLANT_KIND_LABELS,
  PLANT_KINDS,
  PLANT_SIZE_LABELS,
  PLANT_SIZES,
  rangesCoverMonth,
  SUN_PART_LABELS,
  sunLength,
  sunPart,
  WIND_LABELS,
  WIND_LEVELS,
  WIND_TOLERANT,
  type PlantFlag,
  type SearchPlant,
  type SunPart,
} from '@growme/shared';

// Every plant filter, defined once: the Explore sheet (short set), the results page's Filters sheet
// (full set) and its kind tabs all read from here, and lib/plant-filter-match.ts applies them to the
// search index's plants. A new filter is one entry in FILTERS (and its id in a set below).

/** What a filter reads: a plant of the search index */
export type FilterPlant = SearchPlant;

export type FilterOption = { id: string; label: string; test: (plant: FilterPlant) => boolean };

/**
 * A checkbox of the short set that stands for several options of another filter (e.g. «Αντέχει
 * αέρα» = the two strongest wind levels): checked when they are all chosen, and toggles them together
 */
export type LinkedOption = { id: string; label: string; filter: FilterId; values: readonly string[] };

export type FilterDef = {
  id: FilterId;
  label: string;
  /** one: a single choice (tap it again to clear); many: any number */
  select: 'one' | 'many';
  options: FilterOption[];
  /** Shown only where the set asks for them (the short set) */
  linked?: LinkedOption[];
};

export type FilterId = 'kind' | 'size' | 'price' | 'sun-length' | 'sun-part' | 'season' | 'wind' | 'traits' | 'properties';

/** The chosen options by filter (a single choice is an array of at most one) */
export type Filters = Partial<Record<FilterId, string[]>>;

/* ─────────────── Helpers for the options ─────────────── */

/** A price range in euros; `max` is exclusive (null = no upper limit) */
export type PriceOption = FilterOption & { min: number; max: number | null };

/** The plant's price range in euros, or null when it has no price */
export function priceRange({ priceMin, priceMax }: FilterPlant): [number, number] | null {
  const low = priceMin ?? priceMax;
  const high = priceMax ?? priceMin;
  return low === null || high === null ? null : [low / 100, high / 100];
}

const priceOption = (id: string, label: string, min: number, max: number | null): PriceOption => ({
  id,
  label,
  min,
  max,
  // Its range overlaps the option's
  test: (plant) => {
    const range = priceRange(plant);
    return !!range && range[1] >= min && (max === null || range[0] < max);
  },
});

export const PRICE_OPTIONS: PriceOption[] = [
  priceOption('up-to-3', 'Έως 3 €', 0, 3),
  priceOption('3-6', '3 – 6 €', 3, 6),
  priceOption('6-10', '6 – 10 €', 6, 10),
  priceOption('10-plus', '10 € +', 10, null),
];

/** Its sun window lasts from `low` to `high` hours */
const sunHoursIn = (plant: FilterPlant, low: number, high: number) => {
  const hours = sunLength(plant.sunStart, plant.sunEnd);
  return hours !== null && hours >= low && hours <= high;
};
const partOf = (plant: FilterPlant): SunPart | null =>
  plant.sunStart === null || plant.sunEnd === null ? null : sunPart(plant.sunStart, plant.sunEnd);

const SEASONS = [
  { id: 'winter', label: 'Χειμώνας', months: [12, 1, 2] },
  { id: 'spring', label: 'Άνοιξη', months: [3, 4, 5] },
  { id: 'summer', label: 'Καλοκαίρι', months: [6, 7, 8] },
  { id: 'autumn', label: 'Φθινόπωρο', months: [9, 10, 11] },
];

const flagOption = (key: PlantFlag): FilterOption => ({
  id: key,
  label: PLANT_FLAGS.find((flag) => flag.key === key)!.label,
  test: (plant) => plant[key],
});

/* ─────────────── The filters ─────────────── */

/** Plural names for the kind tabs (the dashboard's labels are singular) */
const KIND_PLURALS: Record<(typeof PLANT_KINDS)[number], string> = {
  flowers: 'Ανθοφόρα',
  leaves: 'Φυλλώδη',
  bush: 'Θάμνοι',
};

export const FILTERS: Record<FilterId, FilterDef> = {
  kind: {
    id: 'kind',
    label: 'Είδος',
    select: 'one',
    options: PLANT_KINDS.map((kind) => ({ id: kind, label: PLANT_KIND_LABELS[kind], test: (p) => p.kind === kind })),
  },
  size: {
    id: 'size',
    label: 'Μέγεθος',
    select: 'one',
    options: PLANT_SIZES.map((size) => ({ id: size, label: PLANT_SIZE_LABELS[size], test: (p) => p.size === size })),
  },
  price: { id: 'price', label: 'Τιμή', select: 'one', options: PRICE_OPTIONS },
  'sun-length': {
    id: 'sun-length',
    label: 'Ώρες ήλιου',
    select: 'one',
    options: [
      { id: 'few', label: 'Λίγες (έως 2)', test: (p) => sunHoursIn(p, 0, 2) },
      { id: 'some', label: 'Μέτριες (3–5)', test: (p) => sunHoursIn(p, 3, 5) },
      { id: 'lots', label: 'Πολλές (6+)', test: (p) => sunHoursIn(p, 6, 24) },
    ],
  },
  'sun-part': {
    id: 'sun-part',
    label: 'Πότε θέλει ήλιο',
    select: 'one',
    options: (['morning', 'noon', 'afternoon'] as const).map((part) => ({
      id: part,
      label: SUN_PART_LABELS[part],
      test: (p) => partOf(p) === part,
    })),
  },
  season: {
    id: 'season',
    label: 'Εποχή',
    select: 'many',
    options: SEASONS.map((season) => ({
      id: season.id,
      label: season.label,
      // Any of its (up to 3) planting ranges reaches the season
      test: (p) => season.months.some((month) => rangesCoverMonth(p.monthRanges, month)),
    })),
  },
  wind: {
    id: 'wind',
    label: 'Αέρας',
    select: 'many',
    options: WIND_LEVELS.map((level) => ({ id: level, label: WIND_LABELS[level], test: (p) => p.wind === level })),
  },
  traits: {
    id: 'traits',
    label: 'Χαρακτηριστικά',
    select: 'many',
    options: [
      { id: 'frostHardy', label: 'Ανθεκτικό στον παγετό', test: (p) => p.frostHardy },
      { id: 'nearSea', label: 'Κοντά στη θάλασσα', test: (p) => p.nearSea },
    ],
    linked: [{ id: 'wind-tolerant', label: 'Αντέχει αέρα', filter: 'wind', values: WIND_TOLERANT }],
  },
  properties: {
    id: 'properties',
    label: 'Ιδιότητες',
    select: 'many',
    options: (['food', 'aromatic', 'climbing', 'succulent', 'ornamental', 'privacy', 'smallTree'] as const).map(flagOption),
  },
};

/* ─────────────── Where each filter shows ─────────────── */

/** The Explore sheet (home): a few quick choices; «Αντέχει αέρα» stands for the strong wind levels */
export const SHORT_FILTERS: FilterId[] = ['size', 'sun-length', 'price', 'traits', 'kind'];

/** The results page's Filters sheet: everything except the kind (its tabs) */
export const FULL_FILTERS: FilterId[] = ['price', 'size', 'sun-length', 'sun-part', 'season', 'wind', 'traits', 'properties'];

/** The results page's tabs: all plants, or one kind */
export const KIND_TABS = [
  { id: 'all', label: 'Όλα' },
  ...PLANT_KINDS.map((kind) => ({ id: kind, label: KIND_PLURALS[kind] })),
];

/** Ready-made searches at the end of the Filters sheet: each sets these filters */
export const PRESETS: { id: string; label: string; filters: Filters }[] = [
  { id: 'small-pot-flowers', label: 'Μικρή γλάστρα με λουλούδια', filters: { size: ['small'], kind: ['flowers'] } },
  { id: 'small-tree', label: 'Μικρό δέντρο για παρτέρι', filters: { properties: ['smallTree'] } },
];
