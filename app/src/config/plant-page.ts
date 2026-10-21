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

/** Frost, sea salt and wind rows: only the plants that tolerate them a medium or a big deal */
export const restrictionRows = (plant: PlantSummary) =>
  TOLERANCES.flatMap(({ key }) => {
    const level = plant[key];
    return level === 'medium' || level === 'big'
      ? [{ key, icon: TOLERANCE_ICONS[key], text: SENTENCES[key][level], level: TOLERANCE_LABELS[level] }]
      : [];
  });

/* ─────────────── Notes and the three watch-out blocks ─────────────── */

export const NOTES = [
  { key: 'trivia', title: 'Ηξερες οτι' },
  { key: 'secret', title: 'Μυστικό επιτυχίας' },
] as const satisfies readonly { key: 'trivia' | 'secret'; title: string }[];

export const WATCH_OUT_ITEMS = [
  { key: 'symptoms', title: 'Τι βλέπω' },
  { key: 'what', title: 'Τι είναι' },
  { key: 'action', title: 'Τι κάνω' },
] as const satisfies readonly { key: 'symptoms' | 'what' | 'action'; title: string }[];

/* ─────────────── Lifecycle tabs ─────────────── */

/** The tabs, in order: label and the colour of the lit button */
export const LIFECYCLE_TAB_DEFS: readonly { tab: LifecycleTab; label: string; color: string }[] = LIFECYCLE_TABS.map((tab) => ({
  tab,
  label: LIFECYCLE_TAB_LABELS[tab],
  color: { seed: colors.seed, plant: colors.primary, care: colors.accent }[tab],
}));
