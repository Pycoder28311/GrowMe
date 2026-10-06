import type { ImageSourcePropType } from 'react-native';

import { BACKGROUND_PHOTOS } from './background-photos';
import { PLANTS, type Plant } from './plants';

// Example content for the plant page (until it comes from the API's plants, tips, diseases and
// lifecycles). Tips, diseases and description are optional: the page leaves out what's missing.

export type PlantDetails = {
  scientificName: string;
  /** e.g. "Γλάστρα 20–30 cm" */
  potSize: string;
  /** How it is started and grows, in one sentence */
  growing: string;
  nativeTo: string;
  climate: string;
  /** Life cycle milestones, e.g. "Πρώτα άνθη" → "1 μήνας" */
  lifecycle: { label: string; value: string }[];
  tips: string[];
  diseases: { name: string; text: string }[];
  description?: string;
  /** Plants shown under "Σχετικά φυτά" */
  relatedIds: string[];
};

const DETAILS: Record<string, PlantDetails> = {
  tomato: {
    scientificName: 'Solanum lycopersicum',
    potSize: 'Γλάστρα 30–40 cm',
    growing: 'Ξεκινά από σπόρο ή έτοιμο φυτό και θέλει στήριγμα καθώς ψηλώνει.',
    nativeTo: 'Ιθαγενής της Νότιας Αμερικής (Άνδεις).',
    climate: 'Ζεστό κλίμα· δεν αντέχει τον παγετό.',
    lifecycle: [
      { label: 'Πρώτα άνθη', value: '1 μήνας' },
      { label: 'Πρώτοι καρποί', value: '2–3 μήνες' },
      { label: 'Διάρκεια ζωής', value: '1 χρόνος' },
    ],
    tips: [
      'Πότιζε στη βάση, όχι στα φύλλα, για να μην αρρωστήσει.',
      'Κόβε τα πλάγια βλαστάρια για μεγαλύτερους καρπούς.',
      'Λίπανση κάθε 2 εβδομάδες μόλις ανθίσει.',
    ],
    diseases: [
      { name: 'Περονόσπορος', text: 'Καφέ κηλίδες στα φύλλα με υγρασία· αφαίρεσε τα προσβεβλημένα φύλλα.' },
      { name: 'Ωίδιο', text: 'Λευκή σκόνη στα φύλλα· βελτίωσε τον αερισμό.' },
    ],
    description:
      'Η πιο αγαπημένη ντομάτα του μπαλκονιού: με αρκετό ήλιο και τακτικό πότισμα δίνει καρπούς όλο το καλοκαίρι.',
    relatedIds: ['pepper', 'basil', 'lettuce'],
  },
  basil: {
    scientificName: 'Ocimum basilicum',
    potSize: 'Γλάστρα 15–20 cm',
    growing: 'Φυτρώνει εύκολα από σπόρο· κόβε τις κορυφές για να πυκνώσει.',
    nativeTo: 'Ιθαγενής της τροπικής Ασίας.',
    climate: 'Ζέστη και ήλιος· μέσα στο σπίτι τον χειμώνα.',
    lifecycle: [
      { label: 'Πρώτο κόψιμο', value: '1 μήνας' },
      { label: 'Ανθοφορία', value: '2–3 μήνες' },
      { label: 'Διάρκεια ζωής', value: '1 χρόνος' },
    ],
    tips: ['Κόβε τα λουλούδια για να συνεχίσει να βγάζει φύλλα.', 'Θέλει πότισμα όταν στεγνώσει η επιφάνεια.'],
    diseases: [{ name: 'Σήψη ριζών', text: 'Από υπερβολικό νερό· φρόντισε για καλή αποστράγγιση.' }],
    description: 'Αρωματικό βότανο για την κουζίνα, που διώχνει και τα κουνούπια από το μπαλκόνι.',
    relatedIds: ['mint', 'tomato', 'lavender'],
  },
  lavender: {
    scientificName: 'Lavandula stoechas',
    potSize: 'Γλάστρα 25–30 cm',
    growing: 'Φυτεύεται ως έτοιμο φυτό· αντέχει την ξηρασία.',
    nativeTo: 'Ιθαγενής της Μεσογείου.',
    climate: 'Ζεστό, ξηρό κλίμα· αντέχει ήπιους χειμώνες.',
    lifecycle: [
      { label: 'Πρώτα άνθη', value: '2 μήνες' },
      { label: 'Πλήρης ανθοφορία', value: '6 μήνες' },
      { label: 'Διάρκεια ζωής', value: '5–10 χρόνια' },
    ],
    tips: ['Λίγο νερό: το υγρό χώμα τη βλάπτει.', 'Κλάδεμα μετά την ανθοφορία για να μείνει πυκνή.'],
    diseases: [],
    relatedIds: ['geranium', 'basil', 'mint'],
  },
};

const SCIENTIFIC_NAMES: Record<string, string> = {
  lettuce: 'Lactuca sativa',
  geranium: 'Pelargonium × hortorum',
  mint: 'Mentha spicata',
  pepper: 'Capsicum annuum',
  orchid: 'Phalaenopsis',
};

/** The example details of a plant (plants without their own get a short generic version) */
export function plantDetails(plant: Plant): PlantDetails {
  return (
    DETAILS[plant.id] ?? {
      scientificName: SCIENTIFIC_NAMES[plant.id] ?? '',
      potSize: 'Γλάστρα 20–30 cm',
      growing: 'Ξεκινά εύκολα και θέλει τακτικό πότισμα.',
      nativeTo: 'Καλλιεργείται σε όλη την Ευρώπη.',
      climate: 'Ήπιο κλίμα· προστασία από τον παγετό.',
      lifecycle: [
        { label: 'Πρώτη ανάπτυξη', value: '1 μήνας' },
        { label: 'Διάρκεια ζωής', value: '1 χρόνος' },
      ],
      tips: [],
      diseases: [],
      relatedIds: PLANTS.filter((other) => other.id !== plant.id)
        .slice(0, 3)
        .map((other) => other.id),
    }
  );
}

/** Photos for the plant page's carousel: the plant, then example balcony photos */
export const plantGallery = (plant: Plant): ImageSourcePropType[] => [
  plant.image,
  ...BACKGROUND_PHOTOS.slice(0, 3).map((photo) => photo.source),
];
