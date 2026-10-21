
import { SunIcon } from '@/components/plants/sun-icon';
import { TileCard } from '@/components/plants/tile-card';
import { FACT_ICONS } from '@/config/plant-icons';
import { sunPhrase, sunSquareOf } from '@/config/plant-page';
import type { PlantSummary } from '@growme/shared';
import { sunPart } from '@growme/shared';

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * The sunlight square, the first one and only for exterior plants: the sun of that part of the day, the
 * hours, and under them (worked out here from the hours) when the plant wants its light.
 */
export function SunSquare({ plant, style }: { plant: PlantSummary; style?: object }) {
  const sun = sunSquareOf(plant);
  if (!sun) return null;
  const { bar, soft } = sun;
  return (
    <TileCard
      style={style}
      icon={FACT_ICONS.sun}
      label={soft ? 'Απαλό φως' : 'Ήλιος'}
      value={`${clock(bar.start)} – ${clock(bar.end)}`}
      caption={sunPhrase(bar)}
      art={<SunIcon part={sunPart(bar.start, bar.end)} size={44} />}
    />
  );
}

