import type { Plant } from './plants';

/** Explore filters as { [groupId]: optionId[] } */
export type Filters = Record<string, string[]>;

export const FILTER_GROUPS = [
  {
    id: 'type',
    label: 'Τύπος φυτού',
    options: [
      { id: 'indoor', label: 'Εσωτερικού χώρου' },
      { id: 'outdoor', label: 'Εξωτερικού χώρου' },
      { id: 'succulents', label: 'Παχύφυτα' },
      { id: 'herbs', label: 'Αρωματικά' },
      { id: 'flowering', label: 'Ανθοφόρα' },
      { id: 'trees', label: 'Δέντρα' },
    ],
  },
  {
    id: 'light',
    label: 'Φως',
    options: [
      { id: 'full-sun', label: 'Πλήρης ήλιος' },
      { id: 'partial-shade', label: 'Ημισκιά' },
      { id: 'shade', label: 'Σκιά' },
    ],
  },
  {
    id: 'care',
    label: 'Φροντίδα',
    options: [
      { id: 'easy', label: 'Εύκολη' },
      { id: 'moderate', label: 'Μέτρια' },
      { id: 'expert', label: 'Απαιτητική' },
    ],
  },
  {
    id: 'water',
    label: 'Πότισμα',
    options: [
      { id: 'low', label: 'Λίγο' },
      { id: 'medium', label: 'Μέτριο' },
      { id: 'high', label: 'Πολύ' },
    ],
  },
];

// Quick category tabs at the top of the results page; `matches` decides which plants each one shows
export const CATEGORY_TABS = [
  { id: 'all', label: 'Όλα', matches: () => true },
  { id: 'vegetables', label: 'Κηπευτικά', matches: (plant: Plant) => plant.types.includes('vegetables') },
  { id: 'flowering', label: 'Με άνθη', matches: (plant: Plant) => plant.types.includes('flowering') },
];

// A plant passes when, for every filter group with selections, it matches at least one selected option
export function matchesFilters(plant: Plant, filters: Filters) {
  return Object.entries(filters).every(([groupId, selected]) => {
    if (!selected?.length) return true;
    if (groupId === 'type') return selected.some((type) => plant.types.includes(type));
    return selected.includes(plant[groupId as 'light' | 'care' | 'water']);
  });
}
