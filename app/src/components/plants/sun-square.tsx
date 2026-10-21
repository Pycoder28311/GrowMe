
import { sunPart, type PlantSummary } from '@growme/shared';

import { SunIcon } from '@/components/plants/sun-icon';
import { TileCard } from '@/components/plants/tile-card';
import type { TileShapeKind } from '@/components/ui/flower-shapes';
import { FACT_ICONS } from '@/config/plant-icons';
import { sunPhrase, sunSquareOf } from '@/config/plant-page';
import type { TileTone } from '@/theme';

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * The sunlight square, the first one and only for exterior plants: the sun of that part of the day, the
 * hours, and under them (worked out here from the hours) when the plant wants its light.
 */
export function SunSquare({ plant, style, tone, shape }: { plant: PlantSummary; style?: object; tone: TileTone; shape: TileShapeKind }) {
  const sun = sunSquareOf(plant);
  if (!sun) return null;
  const { bar, soft } = sun;
  return (
    <TileCard
      style={style}
      tone={tone}
      shape={shape}
      icon={FACT_ICONS.sun}
      label={soft ? 'Απαλό φως' : 'Ήλιος'}
      value={`${clock(bar.start)} – ${clock(bar.end)}`}
      caption={sunPhrase(bar)}
      art={<SunIcon part={sunPart(bar.start, bar.end)} size={44} />}
    />
  );
}

