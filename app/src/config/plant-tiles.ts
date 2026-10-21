import {
  DIFFICULTY_LABELS,
  EFFORT_LEVELS,
  PLANT_USAGE_FLAGS,
  POT_SIZE_LABELS,
  POT_SIZES,
  TIME_NEEDED_LABELS,
  TOXICITY,
  TOXICITY_LABELS,
  PLANT_FLAGS,
  type EffortLevel,
  type PlantSummary,
  type PotSize,
  type Toxicity,
} from '@growme/shared';

import { FACT_ICONS, type PlantIcon } from '@/config/plant-icons';
import { type Season } from '@/config/plant-traits';

// The plant page's info squares (after the sunlight square): which ones a plant shows, their words, and
// the one small animation on each (a tile with several values shows the most telling one's). A new square is one entry in TILE_DEFS.

/** One animation on a tile (see components/plants/tile-art) */
export type TileArt =
  | { kind: 'wind'; level: 'strong' | 'moderate' | 'light' | 'sheltered' }
  | { kind: 'season'; season: Season | 'all' }
  | { kind: 'climbing' | 'ornamental' | 'aromatic' | 'frost' }
  | { kind: 'food' | 'succulent'; value: boolean }
  | { kind: 'plantKind'; value: 'flowers' | 'leaves' | 'bush' }
  | { kind: 'difficulty'; value: 1 | 2 | 3 }
  | { kind: 'size'; value: 'small' | 'medium' | 'large' }
  | { kind: 'timeNeeded'; level: EffortLevel }
  | { kind: 'toxicity'; value: Toxicity };

/** `label`: what the tile is about («Δυσκολία»); `value`: the plant's value, in bold */
export type InfoTile = { key: string; icon: PlantIcon; label: string; value: string; art: TileArt | null };

type TileDef = {
  key: string;
  icon: PlantIcon;
  label: string;
  /** The tile's value and animations for a plant, or null when the plant has nothing for it */
  build: (plant: PlantSummary) => { value: string; art: TileArt | null } | null;
};

/** The levels a plant is marked with, easiest first */
const levelsOf = (levels: readonly EffortLevel[]) => EFFORT_LEVELS.filter((level) => levels.includes(level));
const hardestOf = (levels: readonly EffortLevel[]) => levelsOf(levels).at(-1);

/** Pot sizes on the size animation: the two biggest share the tallest drawing */
const POT_ART: Record<PotSize, 'small' | 'medium' | 'large'> = { small: 'small', medium: 'medium', big: 'large', large: 'large' };

/** A usage flag's animation, for the ones that have one */
const USAGE_ART: Partial<Record<(typeof PLANT_USAGE_FLAGS)[number], TileArt>> = {
  food: { kind: 'food', value: true },
  climbing: { kind: 'climbing' },
  ornamental: { kind: 'ornamental' },
  aromatic: { kind: 'aromatic' },
  succulent: { kind: 'succulent', value: true },
};

export const TILE_DEFS: readonly TileDef[] = [
  {
    key: 'difficulty',
    icon: FACT_ICONS.difficulty,
    label: 'Δυσκολία',
    build: ({ difficultyLevels }) => {
      const hardest = hardestOf(difficultyLevels);
      if (!hardest) return null;
      return {
        value: levelsOf(difficultyLevels).map((level) => DIFFICULTY_LABELS[level]).join(', '),
        art: { kind: 'difficulty', value: (EFFORT_LEVELS.indexOf(hardest) + 1) as 1 | 2 | 3 },
      };
    },
  },
  {
    key: 'usage',
    icon: FACT_ICONS.usage,
    label: 'Χρήση',
    build: (plant) => {
      const on = PLANT_USAGE_FLAGS.filter((key) => plant[key]);
      if (on.length === 0) return null;
      return {
        value: on.map((key) => PLANT_FLAGS.find((flag) => flag.key === key)!.label).join(', '),
        // The first usage that has a drawing
        art: on.map((key) => USAGE_ART[key]).find((art) => art) ?? null,
      };
    },
  },
  {
    key: 'timeNeeded',
    icon: FACT_ICONS.timeNeeded,
    label: 'Χρόνος που θέλει',
    build: ({ timeNeeded }) => {
      const hardest = hardestOf(timeNeeded);
      if (!hardest) return null;
      return {
        value: levelsOf(timeNeeded).map((level) => TIME_NEEDED_LABELS[level]).join(', '),
        art: { kind: 'timeNeeded', level: hardest },
      };
    },
  },
  {
    key: 'toxicity',
    icon: FACT_ICONS.toxicity,
    label: 'Τοξικό για',
    build: ({ toxicity }) => {
      const values = TOXICITY.filter((value) => toxicity.includes(value));
      if (values.length === 0) return null;
      return {
        value: values.map((value) => TOXICITY_LABELS[value]).join(', '),
        // One drawing: the first animal (or the check for «none»)
        art: { kind: 'toxicity', value: values[0] },
      };
    },
  },
  {
    key: 'potSize',
    icon: FACT_ICONS.potSize,
    label: 'Μέγεθος γλάστρας',
    build: ({ potSizes }) => {
      const sizes = POT_SIZES.filter((size) => potSizes.includes(size));
      if (sizes.length === 0) return null;
      // The sizes without their diameters (those are in the filter), and the biggest one's drawing
      return {
        value: sizes.map((size) => POT_SIZE_LABELS[size].replace(/\s*\(.*\)/, '')).join(', '),
        art: { kind: 'size', value: POT_ART[sizes[sizes.length - 1]] },
      };
    },
  },
];

/** The tiles a plant shows, in the page's order (the sunlight square is separate: components/plants/sun-square.tsx) */
export function infoTiles(plant: PlantSummary): InfoTile[] {
  return TILE_DEFS.flatMap((def) => {
    const built = def.build(plant);
    return built ? [{ key: def.key, icon: def.icon, label: def.label, ...built }] : [];
  });
}
