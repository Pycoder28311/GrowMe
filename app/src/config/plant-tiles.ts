import {
  DIFFICULTY_LABELS,
  flagPhrase,
  PLANT_KIND_LABELS,
  PLANT_SIZE_LABELS,
  WIND_LABELS,
  type Difficulty,
  type PlantFlag,
  type PlantKind,
  type PlantSize,
  type PlantSummary,
  type WindLevel,
} from '@growme/shared';

import { FACT_ICONS, FLAG_ICONS, KIND_ICONS, SIZE_ICON, WIND_ICON, type PlantIcon } from '@/config/plant-icons';
import { rangeSeason, seasonTrait, type Season } from '@/config/plant-traits';

// The plant page's info tiles (plan 11): which ones a plant shows, their words, and the small
// animation (or animations, one per value) on each. The other flags are rows under the sun bar.

/** One animation on a tile (see components/plants/tile-art) */
export type TileArt =
  | { kind: 'wind'; level: WindLevel }
  | { kind: 'season'; season: Season | 'all' }
  | { kind: 'climbing' | 'ornamental' | 'aromatic' | 'frost' }
  | { kind: 'food' | 'succulent'; value: boolean }
  | { kind: 'plantKind'; value: PlantKind }
  | { kind: 'difficulty'; value: Difficulty }
  | { kind: 'size'; value: PlantSize };

export type InfoTile = { key: string; icon: PlantIcon; label: string; arts: TileArt[] };

/** A yes/no tile: shown when yes, or always (`always`) with the «no» words */
function flagTile(plant: PlantSummary, key: PlantFlag, art: (value: boolean) => TileArt, always = false): InfoTile | null {
  const value = plant[key];
  const label = flagPhrase(key, value);
  if (!label || (!value && !always)) return null;
  return { key, icon: FLAG_ICONS[key], label, arts: [art(value)] };
}

/** The tiles a plant shows, in the page's order */
export function infoTiles(plant: PlantSummary): InfoTile[] {
  const season = seasonTrait(plant);
  // One drawing per range's season, the same season once
  const seasons = [...new Set(plant.monthRanges.map(rangeSeason))];
  return [
    plant.wind && { key: 'wind', icon: WIND_ICON, label: WIND_LABELS[plant.wind], arts: [{ kind: 'wind', level: plant.wind }] },
    season && {
      key: 'months',
      icon: FACT_ICONS.season,
      label: `Φύτεμα: ${season.label}`,
      arts: seasons.map((s) => ({ kind: 'season', season: s })),
    },
    flagTile(plant, 'climbing', () => ({ kind: 'climbing' })),
    flagTile(plant, 'ornamental', () => ({ kind: 'ornamental' })),
    flagTile(plant, 'succulent', (value) => ({ kind: 'succulent', value }), true),
    flagTile(plant, 'food', (value) => ({ kind: 'food', value }), true),
    flagTile(plant, 'aromatic', () => ({ kind: 'aromatic' })),
    plant.kind && {
      key: 'kind',
      icon: KIND_ICONS[plant.kind],
      label: PLANT_KIND_LABELS[plant.kind],
      arts: [{ kind: 'plantKind', value: plant.kind }],
    },
    flagTile(plant, 'frostHardy', () => ({ kind: 'frost' })),
    {
      key: 'difficulty',
      icon: FACT_ICONS.difficulty,
      label: `Δυσκολία: ${DIFFICULTY_LABELS[plant.difficulty]}`,
      arts: [{ kind: 'difficulty', value: plant.difficulty }],
    },
    plant.size && {
      key: 'size',
      icon: SIZE_ICON,
      label: `Μέγεθος: ${PLANT_SIZE_LABELS[plant.size]}`,
      arts: [{ kind: 'size', value: plant.size }],
    },
  ].filter((tile): tile is InfoTile => !!tile);
}
