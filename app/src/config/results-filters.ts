import { PLANTS } from './plants';

// The filters of the results page's Filters sheet, top to bottom.
// Each section is one object; the sheet draws it by its `type` (see components/filters/filter-sheet.tsx).
// Not applied to the list yet: the sheet only keeps the selections while it is open.

export type FilterOption = { id: string; label: string };

/** A price range to pick; `max` is exclusive (null = no upper limit) */
export type PriceOption = FilterOption & { min: number; max: number | null };

export type FilterSectionConfig =
  | { type: 'price'; id: string; label: string; options: PriceOption[] }
  | { type: 'checkboxes'; id: string; label: string; options: FilterOption[] }
  | { type: 'radio'; id: string; label: string; options: FilterOption[] }
  | { type: 'steps'; id: string; label: string; stops: number[] }
  | { type: 'more'; id: string; label: string }
  | { type: 'suggestions'; id: string; label: string; options: FilterOption[] };

export const RESULTS_FILTERS: FilterSectionConfig[] = [
  {
    type: 'price',
    id: 'price',
    label: 'Τιμή',
    options: [
      { id: 'up-to-3', label: 'Έως 3 €', min: 0, max: 3 },
      { id: '3-6', label: '3 – 6 €', min: 3, max: 6 },
      { id: '6-10', label: '6 – 10 €', min: 6, max: 10 },
      { id: '10-plus', label: '10 € +', min: 10, max: null },
    ],
  },
  {
    type: 'checkboxes',
    id: 'season',
    label: 'Εποχή',
    options: [
      { id: 'summer', label: 'Καλοκαίρι' },
      { id: 'autumn', label: 'Φθινόπωρο' },
      { id: 'winter', label: 'Χειμώνας' },
      { id: 'spring', label: 'Άνοιξη' },
    ],
  },
  {
    type: 'radio',
    id: 'planting',
    label: 'Τρόπος εγκατάστασης',
    options: [
      { id: 'seed', label: 'Με σπόρους' },
      { id: 'planted', label: 'Φυτεμένο' },
    ],
  },
  { type: 'steps', id: 'sun-hours', label: 'Ώρες ήλιου', stops: [0, 3, 6, 9, 12] },
  {
    type: 'checkboxes',
    id: 'scent',
    label: 'Άρωμα',
    options: [
      { id: 'subtle', label: 'Διακριτικό' },
      { id: 'faint', label: 'Άτονο' },
      { id: 'evening', label: 'Για βράδυ' },
      { id: 'strong', label: 'Έντονο' },
    ],
  },
  // Placeholder: the remaining filters will be added here
  { type: 'more', id: 'more', label: 'Περισσότερα φίλτρα' },
  {
    type: 'suggestions',
    id: 'popular',
    label: 'Δημοφιλείς αναζητήσεις',
    options: [
      { id: 'small-pot-flowers', label: 'Μικρή γλάστρα με λουλούδια' },
      { id: 'small-tree-garden', label: 'Μικρό δέντρο για παρτέρι' },
    ],
  },
];

/** Price chart: how many plants are sold at each price, one bar per euro (like a shop's price histogram) */
export const PRICE_STEP = 1;
export const PRICE_MAX = Math.max(...PLANTS.map((plant) => plant.price.max));

export const PRICE_COUNTS = Array.from({ length: Math.ceil(PRICE_MAX / PRICE_STEP) }, (_, index) => {
  const price = index * PRICE_STEP;
  return PLANTS.filter((plant) => plant.price.min <= price && price < plant.price.max).length;
});

/** True when a price falls inside one of the options */
export const priceInOptions = (price: number, options: PriceOption[]) =>
  options.some((option) => price >= option.min && (option.max === null || price < option.max));
