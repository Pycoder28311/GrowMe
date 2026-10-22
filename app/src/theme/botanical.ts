import { Platform } from 'react-native';

import { botanical, TILE_TONES } from '@/config/botanical-theme';

// The botanical look of the plant page (from the Geranium mockup): a warm cream page, soft earthy tile
// colours, terracotta and olive accents, and a serif for names and values. The colours themselves live in
// config/botanical-theme.ts; this file re-exports them and adds the fonts and helpers.

export {
  artColors,
  BACKGROUND_DECORATIONS,
  BACKGROUND_MOTION,
  type BackgroundDecoration,
  botanical,
  botanicalRadius,
  GRID_TILE_TONES,
  gridTileIndex,
  HEADER_FLOWERS,
  PAGE_DECORATIONS,
  sunColors,
  TILE_FLOWER_COLORS,
  TILE_TONES,
  tileGrain,
  tileShadow,
  tileShadowStyle,
  TITLE_FLOWER,
  warmShadow,
  type TileTone,
} from '@/config/botanical-theme';

/** The tone of the tile at `index` (they repeat after three) */
export const tileTone = (index: number) => TILE_TONES[index % TILE_TONES.length];

/** A serif for plant names and tile values (the system's: Georgia on iPhone and the web, Noto Serif on Android) */
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

/** Small uppercase labels above values («WIND», «ΣΠΟΡΑ:») */
export const smallCaps = { fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' } as const;

/** Section titles («Περιγραφή», «Τι να προσέχεις», a sheet's groups): the serif, a size up */
export const sectionTitle = { fontFamily: serif, fontSize: 24, lineHeight: 30, color: botanical.ink } as const;

/** Titles across the app (pages, sections, sheets, cards): the plant page's serif, at the title's own size */
export const titleFont = { fontFamily: serif } as const;

/** A colour moved towards another by `amount` (0–1), e.g. the light and dark sides of a painted shape */
export function mixColor(hex: string, other: string, amount: number) {
  const parse = (value: string) => {
    const n = parseInt(value.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [a, b] = [parse(hex), parse(other)];
  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
export const lighter = (hex: string, amount = 0.25) => mixColor(hex, '#ffffff', amount);
export const darker = (hex: string, amount = 0.2) => mixColor(hex, '#000000', amount);
