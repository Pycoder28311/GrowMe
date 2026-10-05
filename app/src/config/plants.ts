import type { ImageSourcePropType } from 'react-native';

// Sample plants for the results page (until the app reads them from the API).
// Trait values are keys into config/plant-traits.ts and match the option ids in config/filters.ts.
// Photos are from Wikimedia Commons (credits below); CC BY-SA requires crediting them when published.

export type Plant = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: { min: number; max: number };
  types: string[];
  light: string;
  care: string;
  water: string;
  use: string;
  propagation: string;
  months: [number, number];
  credit: { author: string; license: string; source: string };
};

export const PLANTS: Plant[] = [
  {
    id: 'tomato',
    name: 'Ντομάτα',
    image: require('@/assets/images/plants/tomato.webp'),
    price: { min: 3, max: 6 },
    types: ['vegetables', 'outdoor'],
    light: 'full-sun',
    care: 'moderate',
    water: 'high',
    use: 'edible',
    propagation: 'both',
    months: [4, 7],
    credit: { author: 'Kolforn', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:2017-12-21_Moneymaker_tomato_plant_(Solanum_lycopersicum),_Albufeira.JPG' },
  },
  {
    id: 'basil',
    name: 'Βασιλικός',
    image: require('@/assets/images/plants/basil.webp'),
    price: { min: 2, max: 5 },
    types: ['herbs', 'outdoor', 'indoor'],
    light: 'full-sun',
    care: 'easy',
    water: 'medium',
    use: 'edible',
    propagation: 'both',
    months: [5, 8],
    credit: { author: 'Netha Hussain', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Basil_plant_in_a_pot_02.jpg' },
  },
  {
    id: 'lavender',
    name: 'Λεβάντα',
    image: require('@/assets/images/plants/lavender.webp'),
    price: { min: 4, max: 9 },
    types: ['flowering', 'herbs', 'outdoor'],
    light: 'full-sun',
    care: 'easy',
    water: 'low',
    use: 'flowering',
    propagation: 'plant',
    months: [3, 5],
    credit: { author: 'Kolforn', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:-2019-06-02_French_lavender_(Rosmaninho-maior),_Trimingham.JPG' },
  },
  {
    id: 'lettuce',
    name: 'Μαρούλι',
    image: require('@/assets/images/plants/lettuce.webp'),
    price: { min: 1, max: 3 },
    types: ['vegetables', 'outdoor'],
    light: 'partial-shade',
    care: 'easy',
    water: 'medium',
    use: 'edible',
    propagation: 'seed',
    months: [9, 3],
    credit: { author: 'DeFacto', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Lactuca_sativa_%27Ashbrook%27.jpg' },
  },
  {
    id: 'geranium',
    name: 'Γεράνι',
    image: require('@/assets/images/plants/geranium.webp'),
    price: { min: 3, max: 8 },
    types: ['flowering', 'outdoor'],
    light: 'full-sun',
    care: 'easy',
    water: 'medium',
    use: 'flowering',
    propagation: 'plant',
    months: [2, 11],
    credit: { author: 'W.carter', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Red_and_white_horseshoe_geranium_in_Tuntorp_2.jpg' },
  },
  {
    id: 'mint',
    name: 'Δυόσμος',
    image: require('@/assets/images/plants/mint.webp'),
    price: { min: 2, max: 4 },
    types: ['herbs', 'outdoor', 'indoor'],
    light: 'partial-shade',
    care: 'easy',
    water: 'high',
    use: 'edible',
    propagation: 'plant',
    months: [3, 6],
    credit: { author: 'NahidHossain', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Mint_plants.jpg' },
  },
  {
    id: 'pepper',
    name: 'Πιπεριά',
    image: require('@/assets/images/plants/pepper.webp'),
    price: { min: 2, max: 5 },
    types: ['vegetables', 'outdoor'],
    light: 'full-sun',
    care: 'moderate',
    water: 'medium',
    use: 'edible',
    propagation: 'both',
    months: [5, 7],
    credit: { author: 'Jeff Kwapil', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Hungarian_wax_pepper_plant.jpg' },
  },
  {
    id: 'orchid',
    name: 'Ορχιδέα',
    image: require('@/assets/images/plants/orchid.webp'),
    price: { min: 12, max: 24 },
    types: ['flowering', 'indoor'],
    light: 'partial-shade',
    care: 'expert',
    water: 'low',
    use: 'decorative',
    propagation: 'plant',
    months: [1, 12],
    credit: { author: 'Timm Schoof', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Pot_Orchid_(124213019).jpeg' },
  },
];
