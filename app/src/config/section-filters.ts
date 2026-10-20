// The filters of the results page's two sections (indoor and outdoor plants). A mockup for now: the choices
// live only in the app (nothing is sent to the backend) and nothing filters the fake plants yet.

export type SectionId = 'indoor' | 'outdoor';

/** The hours the sunlight bars cover: 6 am to 9 pm */
export const SUN_MIN = 6;
export const SUN_MAX = 21;

/** [from, to] in clock hours */
export type SunRange = readonly [number, number];

export type FilterOption = { id: string; label: string };

/** Filters chosen with chips (the ids of the chosen options) */
export type ChipKey = 'pot' | 'difficulty' | 'time' | 'toxicity' | 'usage' | 'seeding' | 'planting' | 'green';

export type SectionFilters = Record<ChipKey, string[]> & {
  /** Hours with intense (direct) sun the plant needs, and hours with light that is not intense */
  sunIntense: SunRange;
  sunWeak: SunRange;
};

export const NO_FILTERS: SectionFilters = {
  sunIntense: [SUN_MIN, SUN_MAX],
  sunWeak: [SUN_MIN, SUN_MAX],
  pot: [],
  difficulty: [],
  time: [],
  toxicity: [],
  usage: [],
  seeding: [],
  planting: [],
  green: [],
};

export type ChipFilter = {
  key: ChipKey;
  label: string;
  options: FilterOption[];
  /** The sections this filter appears in */
  sections: SectionId[];
  /** One choice at most (tap it again to clear) */
  single?: boolean;
};

const SEASONS: FilterOption[] = [
  { id: 'spring', label: 'Άνοιξη' },
  { id: 'summer', label: 'Καλοκαίρι' },
  { id: 'autumn', label: 'Φθινόπωρο' },
  { id: 'winter', label: 'Χειμώνας' },
];

/** In the order they show in the sheet (after the sunlight bars) */
export const CHIP_FILTERS: ChipFilter[] = [
  {
    key: 'pot',
    label: 'Μέγεθος γλάστρας (διάμετρος)',
    sections: ['indoor', 'outdoor'],
    options: [
      { id: 'small', label: 'Μικρή (έως 20 εκ.)' },
      { id: 'medium', label: 'Μεσαία (21–35 εκ.)' },
      { id: 'big', label: 'Μεγάλη (36–50 εκ.)' },
      { id: 'large', label: 'Πολύ μεγάλη (πάνω από 50 εκ.)' },
    ],
  },
  {
    key: 'difficulty',
    label: 'Δυσκολία',
    sections: ['indoor', 'outdoor'],
    options: [
      { id: 'small', label: 'Εύκολο' },
      { id: 'medium', label: 'Μέτριο' },
      { id: 'big', label: 'Δύσκολο' },
    ],
  },
  {
    key: 'time',
    label: 'Χρόνος που θέλει',
    sections: ['indoor', 'outdoor'],
    options: [
      { id: 'small', label: 'Λίγος' },
      { id: 'medium', label: 'Μέτριος' },
      { id: 'big', label: 'Πολύς' },
    ],
  },
  {
    key: 'toxicity',
    label: 'Τοξικότητα (για ποιο ζώο)',
    sections: ['indoor', 'outdoor'],
    options: [
      { id: 'cat', label: 'Γάτα' },
      { id: 'dog', label: 'Σκύλος' },
      { id: 'none', label: 'Για κανένα' },
    ],
  },
  {
    key: 'usage',
    label: 'Χρήση',
    sections: ['outdoor'],
    options: [
      { id: 'edible', label: 'Βρώσιμο' },
      { id: 'climbing', label: 'Αναρριχητικό' },
      { id: 'aromatic', label: 'Αρωματικό' },
      { id: 'ornamental', label: 'Καλλωπιστικό' },
      { id: 'tree', label: 'Δεντράκι' },
      { id: 'lawn', label: 'Πρασινάδα' },
      { id: 'succulent', label: 'Παχύφυτα' },
    ],
  },
  { key: 'seeding', label: 'Εποχή σποράς', sections: ['outdoor'], options: SEASONS },
  { key: 'planting', label: 'Εποχή φύτευσης', sections: ['indoor', 'outdoor'], options: SEASONS },
  {
    key: 'green',
    label: 'Πρασινάδα (αν είναι πράσινο όλο τον χρόνο)',
    sections: ['indoor', 'outdoor'],
    single: true,
    options: [
      { id: 'yes', label: 'Όλο τον χρόνο' },
      { id: 'no', label: 'Μέρος του χρόνου' },
    ],
  },
];

export const chipFiltersFor = (section: SectionId) => CHIP_FILTERS.filter((filter) => filter.sections.includes(section));

/** Choosing a season for sowing clears the planting ones and the other way round */
const EXCLUSIVE_WITH: Partial<Record<ChipKey, ChipKey>> = { seeding: 'planting', planting: 'seeding' };

/** Switches one option on or off, keeping the filters' rules (single choice, «Για κανένα», the two seasons) */
export function toggleOption(filters: SectionFilters, filter: ChipFilter, optionId: string): SectionFilters {
  const chosen = filters[filter.key];
  if (chosen.includes(optionId)) return { ...filters, [filter.key]: chosen.filter((id) => id !== optionId) };

  let next: string[];
  if (filter.single) next = [optionId];
  // «Για κανένα» excludes the animals, and an animal excludes it
  else if (filter.key === 'toxicity') next = optionId === 'none' ? ['none'] : [...chosen.filter((id) => id !== 'none'), optionId];
  else next = [...chosen, optionId];

  const result = { ...filters, [filter.key]: next };
  const other = EXCLUSIVE_WITH[filter.key];
  if (other) result[other] = [];
  return result;
}

const sunChanged = (range: SunRange) => range[0] !== SUN_MIN || range[1] !== SUN_MAX;

/** How many choices are made in a section (a sunlight bar moved from its ends counts as one) */
export function chosenCount(filters: SectionFilters, section: SectionId) {
  const chips = chipFiltersFor(section).reduce((sum, filter) => sum + filters[filter.key].length, 0);
  return chips + Number(sunChanged(filters.sunIntense)) + Number(sunChanged(filters.sunWeak));
}
