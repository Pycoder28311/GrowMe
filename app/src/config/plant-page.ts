import {
  flagPhrase,
  LIFECYCLE_TAB_LABELS,
  LIFECYCLE_TABS,
  stripBlogLinks,
  sunBar,
  sunPart,
  TOLERANCE_LABELS,
  TOLERANCES,
  type LifecycleTab,
  type MonthRange,
  type Plant,
  type PlantSummary,
  type SunBar,
  type ToleranceKey,
} from '@growme/shared';

import { FACT_ICONS, TOLERANCE_ICONS, type PlantIcon } from '@/config/plant-icons';
import type { IconName } from '@/components/ui/icon';
import { botanical, tileTone, type TileTone } from '@/theme/botanical';
import { colors } from '@/theme/colors';

// What the plant page shows besides its tiles, as data: each list feeds one small component, so a new
// chip, date row, restriction or note is one entry here. No React Native code (only colours, from the theme).

/** The page's plant: the API's, plus the dates the API doesn't have yet (mock data only) */
export type PlantPageData = Plant & { floweringSeason?: MonthRange[]; fruitingSeason?: MonthRange[] };

/* ─────────────── Chips above the name ─────────────── */

export const HEADER_CHIPS: readonly { key: string; text: (plant: PlantPageData) => string | null }[] = [
  { key: 'family', text: (p) => p.family },
  // The genus is the first word of the scientific name
  { key: 'genus', text: (p) => p.scientificName.trim().split(/\s+/)[0] || null },
  { key: 'native', text: (p) => (p.native ? stripBlogLinks(p.native) : null) },
  { key: 'privacy', text: (p) => flagPhrase('privacy', p.privacy) },
  { key: 'evergreen', text: (p) => flagPhrase('evergreen', p.evergreen) },
];

export const headerChips = (plant: PlantPageData) =>
  HEADER_CHIPS.flatMap(({ key, text }) => {
    const value = text(plant);
    return value ? [{ key, text: value }] : [];
  });

/* ─────────────── Date rows ─────────────── */

export const DATE_ROWS: readonly { key: string; label: string; icon: PlantIcon; ranges: (plant: PlantPageData) => MonthRange[] }[] = [
  { key: 'seeding', label: 'Σπορά', icon: FACT_ICONS.season, ranges: (p) => p.seedingSeason },
  { key: 'planting', label: 'Φύτεμα', icon: FACT_ICONS.season, ranges: (p) => p.plantingSeason },
  { key: 'flowering', label: 'Ανθοφορία', icon: FACT_ICONS.season, ranges: (p) => p.floweringSeason ?? [] },
  { key: 'fruiting', label: 'Καρποφορία', icon: FACT_ICONS.season, ranges: (p) => p.fruitingSeason ?? [] },
];

/** The rows that have ranges */
export const dateRows = (plant: PlantPageData) =>
  DATE_ROWS.flatMap((row) => {
    const ranges = row.ranges(plant);
    return ranges.length > 0 ? [{ key: row.key, label: row.label, icon: row.icon, ranges }] : [];
  });

/* ─────────────── The sunlight square ─────────────── */

/** Which bar the square shows (the intense one, else the soft one), only for exterior plants */
export function sunSquareOf(plant: PlantSummary): { bar: SunBar; soft: boolean } | null {
  if (!plant.outdoor) return null;
  const intense = sunBar(plant, 'intense');
  if (intense) return { bar: intense, soft: false };
  const soft = sunBar(plant, 'soft');
  return soft ? { bar: soft, soft: true } : null;
}

const PHRASES = { morning: 'Ιδανικά πρωινό φως', noon: 'Ιδανικά μεσημεριανό φως', afternoon: 'Ιδανικά απογευματινό φως' } as const;

/** «Ιδανικά μεσημεριανό φως»: worked out on the phone from the hours */
export const sunPhrase = (bar: SunBar) => PHRASES[sunPart(bar.start, bar.end)];

/* ─────────────── Restriction rows ─────────────── */

const SENTENCES: Record<ToleranceKey, { medium: string; big: string }> = {
  frostTolerance: { medium: 'Αντέχει ελαφρύ παγετό', big: 'Αντέχει δυνατό παγετό' },
  saltTolerance: { medium: 'Αντέχει λίγο το αλατονέφος', big: 'Αντέχει πολύ το αλατονέφος' },
  windTolerance: { medium: 'Αντέχει μέτριο αέρα', big: 'Αντέχει δυνατό αέρα' },
};

/** Each row's colours (the page's three tones): frost the yellow one, sea salt the pink one, wind the beige one */
const ROW_TONES: Record<ToleranceKey, number> = { frostTolerance: 5, saltTolerance: 1, windTolerance: 0 };

/**
 * Frost, sea salt and wind rows: only the plants that tolerate them a medium or a big deal. Each has its title
 * («Παγετός»), the sentence, how much as dots (2 of 3 for medium, 3 of 3 for big) and its colours.
 */
export const restrictionRows = (plant: PlantSummary) =>
  TOLERANCES.flatMap(({ key, label }) => {
    const level = plant[key];
    return level === 'medium' || level === 'big'
      ? [
          {
            key,
            icon: TOLERANCE_ICONS[key],
            title: label,
            text: SENTENCES[key][level],
            levelLabel: TOLERANCE_LABELS[level],
            dots: level === 'big' ? 3 : 2,
            tone: tileTone(ROW_TONES[key]),
          },
        ]
      : [];
  });

/* ─────────────── Notes and the three watch-out blocks ─────────────── */

/** The two notes: their icon and their colours (yellow for the trivia, pink for the secret) */
export const NOTES = [
  { key: 'trivia', title: 'Ηξερες οτι', icon: 'ornamental', tone: 2 },
  { key: 'secret', title: 'Μυστικό επιτυχίας', icon: 'key', tone: 4 },
] as const satisfies readonly { key: 'trivia' | 'secret'; title: string; icon: IconName; tone: number }[];

/** Nutritional value and the cook's tip: shown for aromatic or ornamental plants that have the text, as notes like the two above */
export const NUTRITION_NOTES = [
  { key: 'nutrition', title: 'Θρεπτική αξία', icon: 'food', tone: 0 },
  { key: 'cookTip', title: 'Συμβουλή μαγειρικής', icon: 'aroma', tone: 1 },
] as const satisfies readonly { key: 'nutrition' | 'cookTip'; title: string; icon: IconName; tone: number }[];

/** Whether the plant shows the nutrition notes at all (its flags) */
export const showsNutrition = (plant: PlantPageData) => plant.aromatic || plant.ornamental;

/** The two blocks an open row of «Τι να προσέχεις» shows (its symptoms are in the row itself): their icon and colours (beige, yellow) */
export const WATCH_OUT_ITEMS = [
  { key: 'what', title: 'Τι είναι', icon: 'book', tone: 0 },
  { key: 'action', title: 'Τι κάνω', icon: 'leaf', tone: 5 },
] as const satisfies readonly { key: 'what' | 'action'; title: string; icon: IconName; tone: number }[];

/* ─────────────── Lifecycle tabs ─────────────── */

/** The tabs, in order: label, the colour of the dot by its stages' titles, and its group's tint (all the beige one, so the stages read as one box) */
export const LIFECYCLE_TAB_DEFS: readonly { tab: LifecycleTab; label: string; color: string; tone: TileTone }[] =
  LIFECYCLE_TABS.map((tab) => ({
    tab,
    label: LIFECYCLE_TAB_LABELS[tab],
    color: { seed: colors.seed, plant: botanical.olive, care: botanical.terracotta }[tab],
    tone: tileTone(0),
  }));

export const tabDef = (tab: LifecycleTab) => LIFECYCLE_TAB_DEFS.find((def) => def.tab === tab)!;
