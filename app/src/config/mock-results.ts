import type { PlantCardData } from '@/components/plants/plant-card';

// Fake plants for the results page's two sections (a mockup: nothing here comes from the backend).
// Negative ids, so they can never be taken for a real plant.

const base = {
  cover: null,
  food: false,
  native: null,
} satisfies Pick<PlantCardData, 'cover' | 'food' | 'native'>;

export const MOCK_INDOOR_PLANTS: PlantCardData[] = [
  {
    ...base,
    id: -1,
    name: 'Μονστέρα',
    scientificName: 'Monstera deliciosa',
    priceMin: 15,
    priceMax: 30,
    difficulty: 1,
    sunStart: 9,
    sunEnd: 13,
    monthRanges: [[3, 6]],
    native: 'Ιθαγενές της Κεντρικής Αμερικής',
  },
  {
    ...base,
    id: -2,
    name: 'Σανσεβιέρια',
    scientificName: 'Sansevieria trifasciata',
    priceMin: 8,
    priceMax: 18,
    difficulty: 1,
    sunStart: 8,
    sunEnd: 12,
    monthRanges: [[4, 9]],
  },
  {
    ...base,
    id: -3,
    name: 'Πόθος',
    scientificName: 'Epipremnum aureum',
    priceMin: 6,
    priceMax: 12,
    difficulty: 1,
    sunStart: 10,
    sunEnd: 14,
    monthRanges: [[3, 8]],
  },
];

export const MOCK_OUTDOOR_PLANTS: PlantCardData[] = [
  {
    ...base,
    id: -4,
    name: 'Λεβάντα',
    scientificName: 'Lavandula angustifolia',
    priceMin: 4,
    priceMax: 9,
    difficulty: 1,
    sunStart: 9,
    sunEnd: 17,
    monthRanges: [[3, 5]],
    native: 'Ιθαγενές της Μεσογείου',
  },
  {
    ...base,
    id: -5,
    name: 'Πελαργόνιο',
    scientificName: 'Pelargonium × hortorum',
    priceMin: 3,
    priceMax: 7,
    difficulty: 2,
    sunStart: 8,
    sunEnd: 16,
    monthRanges: [[4, 6]],
  },
  {
    ...base,
    id: -6,
    name: 'Ελιά',
    scientificName: 'Olea europaea',
    priceMin: 25,
    priceMax: 60,
    difficulty: 2,
    sunStart: 8,
    sunEnd: 18,
    monthRanges: [[10, 12], [2, 3]],
    food: true,
    native: 'Ιθαγενές της Μεσογείου',
  },
];
