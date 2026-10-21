import type { Disease, Lifecycle } from '@growme/shared';

import type { PlantPageData } from '@/config/plant-page';

// Fake plants for the plant page (a mockup: nothing here comes from the backend). Negative ids, so they
// can never be taken for a real plant. `usePlant` (lib/plants.ts) reads them while USE_MOCK_PLANTS is on.
// Three cases: a full outdoor plant, an indoor-only one, and a sparse one that has almost nothing set.

const base: PlantPageData = {
  id: 0,
  combinationId: null,
  family: null,
  name: '',
  scientificName: '',
  description: null,
  native: null,
  trivia: null,
  secret: null,
  food: false,
  aromatic: false,
  climbing: false,
  ornamental: false,
  succulent: false,
  smallTree: false,
  greenness: false,
  evergreen: false,
  privacy: false,
  indoor: true,
  outdoor: true,
  lifespanMin: null,
  lifespanMax: null,
  potSizes: [],
  difficultyLevels: [],
  timeNeeded: [],
  toxicity: [],
  frostTolerance: null,
  saltTolerance: null,
  windTolerance: null,
  sunIntenseStart: null,
  sunIntenseEnd: null,
  sunSoftStart: null,
  sunSoftEnd: null,
  seedingSeason: [],
  plantingSeason: [],
  images: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  combination: null,
  lifecycles: [],
  diseases: [],
};

const stage = (id: number, plantId: number, position: number, tab: Lifecycle['tab'], title: string, content: string, duration: string | null): Lifecycle => ({
  id,
  plantId,
  position,
  tab,
  title,
  content,
  duration,
});

const issue = (id: number, plantId: number, title: string, label: string | null, texts: Pick<Disease, 'symptoms' | 'what' | 'action'>): Disease => ({
  id,
  plantId,
  title,
  label,
  ...texts,
});

/** Full outdoor plant: every block shows */
const LAVENDER: PlantPageData = {
  ...base,
  id: -1,
  family: 'Lamiaceae',
  name: 'Λεβάντα',
  scientificName: 'Lavandula angustifolia',
  native: 'Ιθαγενές της Μεσογείου',
  description: 'Αρωματικός θάμνος με μενεξεδί άνθη που αγαπά τον ήλιο και τα φτωχά, καλά αποστραγγιζόμενα εδάφη.',
  trivia: 'Τα άνθη της λεβάντας τρώγονται και χρησιμοποιούνται σε γλυκά και τσάι.',
  secret: 'Κλάδεψέ την ελαφρά μετά την ανθοφορία και ποτέ στο παλιό ξύλο: έτσι ξαναγεμίζει.',
  aromatic: true,
  ornamental: true,
  food: true,
  evergreen: true,
  privacy: true,
  lifespanMin: 10,
  lifespanMax: 15,
  potSizes: ['medium', 'big'],
  difficultyLevels: ['small'],
  timeNeeded: ['small'],
  toxicity: ['cat', 'dog'],
  frostTolerance: 'medium',
  saltTolerance: 'big',
  windTolerance: 'big',
  sunIntenseStart: 10,
  sunIntenseEnd: 16,
  sunSoftStart: 7,
  sunSoftEnd: 10,
  seedingSeason: [[3, 4], [9, 10]],
  plantingSeason: [[3, 5]],
  floweringSeason: [[6, 8]],
  fruitingSeason: [[9, 9]],
  lifecycles: [
    stage(1, -1, 0, 'seed', 'Βλάστηση', 'Οι σπόροι βλασταίνουν σε 2–4 εβδομάδες, σε δροσερό και φωτεινό μέρος.\nΜην τους θάβεις βαθιά.', '2-4 weeks'),
    stage(2, -1, 1, 'seed', 'Νεαρό φυτό', 'Όταν έχει 4 φύλλα το μεταφυτεύεις σε δική του γλάστρα.', '2-3 months'),
    stage(3, -1, 2, 'plant', 'Εγκατάσταση', 'Φύτεψέ τη σε ηλιόλουστο σημείο και πότισε μέτρια το πρώτο καλοκαίρι.', null),
    stage(4, -1, 3, 'plant', 'Ανθοφορία', 'Μενεξεδί στάχεις από τον Ιούνιο ως τον Αύγουστο.', '1-2 months'),
    stage(5, -1, 4, 'care', 'Ποτίσματα', 'Λίγο νερό: μόνο όταν στεγνώσει εντελώς το χώμα.', null),
    stage(6, -1, 5, 'care', 'Κλάδεμα', 'Μετά την ανθοφορία, κόψε το ένα τρίτο των βλαστών.', null),
  ],
  diseases: [
    issue(1, -1, 'Σήψη ριζών', 'Υγρασία', {
      symptoms: 'Τα φύλλα κιτρινίζουν και μαραίνονται ενώ το χώμα είναι υγρό.',
      what: 'Μύκητες του εδάφους που αναπτύσσονται όταν το νερό δεν φεύγει.',
      action: 'Μείωσε το πότισμα και βελτίωσε την αποστράγγιση.',
    }),
    issue(2, -1, 'Αφίδες', null, {
      symptoms: 'Μικρά πράσινα έντομα στις άκρες των βλαστών.',
      what: 'Έντομα που ρουφούν τους χυμούς του φυτού.',
      action: 'Ψέκασε με νερό και σαπούνι ή με ελαιούχο κολλύριο.',
    }),
  ],
};

/** Indoor-only plant: no sunlight square and no seeding row */
const MONSTERA: PlantPageData = {
  ...base,
  id: -2,
  family: 'Araceae',
  name: 'Μονστέρα',
  scientificName: 'Monstera deliciosa',
  native: 'Ιθαγενές της Κεντρικής Αμερικής',
  trivia: 'Οι τρύπες στα φύλλα της εμφανίζονται όταν ωριμάζει.',
  indoor: true,
  outdoor: false,
  greenness: true,
  lifespanMin: 20,
  lifespanMax: 40,
  potSizes: ['big', 'large'],
  difficultyLevels: ['small', 'medium'],
  timeNeeded: ['medium'],
  toxicity: ['cat', 'dog'],
  sunSoftStart: 8,
  sunSoftEnd: 14,
  plantingSeason: [[4, 6]],
  lifecycles: [
    stage(11, -2, 0, 'plant', 'Εγκατάσταση', 'Βάλ’ την σε φωτεινό μέρος χωρίς άμεσο ήλιο.', null),
    stage(12, -2, 1, 'care', 'Πότισμα', 'Όταν στεγνώσουν τα πρώτα 3 εκατοστά του χώματος.', null),
  ],
  diseases: [
    issue(11, -2, 'Καφέ άκρες', null, {
      symptoms: 'Τα άκρα των φύλλων γίνονται καφέ και ξερά.',
      what: 'Ξηρός αέρας ή υπερβολικό πότισμα.',
      action: null,
    }),
  ],
};

/** Sparse plant: almost nothing is set, every block must hide itself */
const SPARSE: PlantPageData = { ...base, id: -3, name: 'Άγνωστο φυτό', scientificName: 'Plantae incognita' };

export const MOCK_PLANTS: readonly PlantPageData[] = [LAVENDER, MONSTERA, SPARSE];

/** The mock plant with this id, or the first one for an id that isn't one (while all plants are mocks) */
export const mockPlant = (id: number): PlantPageData => MOCK_PLANTS.find((plant) => plant.id === id) ?? MOCK_PLANTS[0];
