import type { Disease, ImageRef, Lifecycle } from '@growme/shared';
import type { ImageSourcePropType } from 'react-native';

import type { PlantPageData } from '@/config/plant-page';

// Fake plants for the plant page (a mockup: nothing here comes from the backend). Negative ids, so they
// can never be taken for a real plant. `usePlant` (lib/plants.ts) reads them while USE_MOCK_PLANTS is on.
// Γεράνι first (every plant link opens it): the local database's Γεράνι (id 18) with its fields mapped to the
// new ones, plus values for the fields it didn't have. Then a full outdoor plant, an indoor-only one, and a
// sparse one that has almost nothing set.

/**
 * The mock plants' photos: the app's own bundled photos (no network). A mock photo's url is «mock:<key>»;
 * lib/photo-source.ts turns it into the bundled image.
 */
export const MOCK_PHOTOS: Record<string, ImageSourcePropType> = {
  // Wikimedia Commons, «Red and white horseshoe geranium in Tuntorp 2», W.carter, CC BY-SA 4.0
  geranium: require('@/assets/images/plants/geranium.webp'),
  leaves: require('@/assets/images/backgrounds/plant-page.webp'),
  geraniums: require('@/assets/images/backgrounds/balcony-geraniums-sea-view.webp'),
  hanging: require('@/assets/images/backgrounds/balcony-hanging-pots.webp'),
  alley: require('@/assets/images/backgrounds/alley-potted-plants.webp'),
  shelves: require('@/assets/images/backgrounds/balcony-street-shelves.webp'),
  tropical: require('@/assets/images/backgrounds/balcony-tropical-sunset.webp'),
};

const photos = (...keys: string[]): ImageRef[] => keys.map((key, i) => ({ id: -(i + 1), url: `mock:${key}` }));

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

/**
 * Γεράνι, from the local database's plant 18: name, scientific name, origin, edible, aromatic, privacy,
 * near the sea (now «αλατονέφος»), the sun window 8–14 and the planting months Mar–May and Sep–Nov. The
 * fields it didn't have (family, lifespan, pot sizes, difficulty, time, toxicity, the dates, the texts,
 * the stages and the issues) are filled in with usual values for a garden geranium.
 */
const GERANIUM: PlantPageData = {
  ...base,
  id: -10,
  family: 'Geraniaceae',
  name: 'Γεράνι',
  scientificName: 'Pelargonium × hortorum',
  native: 'Ιθαγενές της Μεσογείου και της Βόρειας Αφρικής',
  images: photos('geranium', 'geraniums'),
  description: 'Το πιο αγαπημένο φυτό του ελληνικού μπαλκονιού: ανθίζει σχεδόν όλο τον χρόνο σε κόκκινο, ροζ ή λευκό και θέλει ελάχιστη φροντίδα.',
  trivia: 'Τα φύλλα του αρωματικού γερανιού μυρίζουν λεμόνι ή τριαντάφυλλο όταν τα τρίψεις.',
  secret: 'Κόβε τα μαραμένα άνθη τακτικά: το φυτό βγάζει αμέσως καινούργια.',
  food: true,
  aromatic: true,
  ornamental: true,
  privacy: true,
  evergreen: true,
  lifespanMin: 3,
  lifespanMax: 5,
  potSizes: ['small', 'medium'],
  difficultyLevels: ['small'],
  timeNeeded: ['small'],
  toxicity: ['cat', 'dog'],
  frostTolerance: 'small',
  saltTolerance: 'big',
  windTolerance: 'medium',
  sunIntenseStart: 8,
  sunIntenseEnd: 14,
  sunSoftStart: 14,
  sunSoftEnd: 18,
  seedingSeason: [[1, 3]],
  plantingSeason: [[3, 5], [9, 11]],
  floweringSeason: [[4, 10]],
  lifecycles: [
    stage(21, -10, 0, 'seed', 'Φύτρωμα', 'Οι σπόροι φυτρώνουν σε 1–3 εβδομάδες σε ζέστη 20–24 °C.', '1-3 weeks'),
    stage(22, -10, 1, 'seed', 'Σπορόφυτο', 'Με 3–4 φύλλα μεταφυτεύεται σε δική του γλαστράκι.', '6-8 weeks'),
    stage(23, -10, 2, 'plant', 'Εγκατάσταση', 'Σε ηλιόλουστο σημείο, με χώμα που στραγγίζει καλά.', null),
    stage(24, -10, 3, 'plant', 'Ανθοφορία', 'Από την άνοιξη ως το φθινόπωρο, με νέα άνθη κάθε λίγες εβδομάδες.', '6-7 months'),
    stage(25, -10, 4, 'care', 'Πότισμα', 'Όταν στεγνώσει το πάνω χώμα· ποτέ λιμνάζον νερό στο πιατάκι.', null),
    stage(26, -10, 5, 'care', 'Χειμώνας', 'Προστάτεψέ το από τον παγετό ή βάλ’ το μέσα σε φωτεινό σημείο.', null),
  ],
  diseases: [
    issue(21, -10, 'Βοτρύτης', 'Υγρασία', {
      symptoms: 'Γκρίζα χνουδωτή μούχλα στα άνθη και στα φύλλα.',
      what: 'Μύκητας που εμφανίζεται με υγρασία και κακό αερισμό.',
      action: 'Κόψε τα προσβεβλημένα μέρη και πότιζε μόνο στο χώμα.',
    }),
    issue(22, -10, 'Πεταλούδα του γερανιού', null, {
      symptoms: 'Τρύπες στα μπουμπούκια και βλαστοί που μαραίνονται.',
      what: 'Η κάμπια της πεταλούδας Cacyreus marshalli που τρέφεται μέσα στους βλαστούς.',
      action: 'Αφαίρεσε τους βλαστούς με κάμπιες και ψέκασε με βιολογικό εντομοκτόνο (Bt).',
    }),
  ],
};

/** Full outdoor plant: every block shows */
const LAVENDER: PlantPageData = {
  ...base,
  id: -1,
  family: 'Lamiaceae',
  name: 'Λεβάντα',
  scientificName: 'Lavandula angustifolia',
  native: 'Ιθαγενές της Μεσογείου',
  images: photos('geraniums', 'hanging', 'alley', 'shelves', 'leaves'),
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
  images: photos('tropical', 'leaves', 'shelves'),
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

export const MOCK_PLANTS: readonly PlantPageData[] = [GERANIUM, LAVENDER, MONSTERA, SPARSE];

/** The mock plant with this id, or the first one for an id that isn't one (while all plants are mocks) */
export const mockPlant = (id: number): PlantPageData => MOCK_PLANTS.find((plant) => plant.id === id) ?? MOCK_PLANTS[0];
