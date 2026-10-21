import { Platform } from 'react-native';

// The botanical look of the plant page (from the Geranium mockup): a warm cream page, soft earthy tile
// colours, terracotta and olive accents, and a serif for names and values. Only the plant page uses it
// for now; other pages keep the app's green theme.

export const botanical = {
  /** The page behind everything: the mockup's warm beige (#f1e9de), two steps deeper */
  page: '#e6d1b6',
  /** Lighter cream for pills, rows and buttons on the page */
  cream: '#fbf7f1',
  /** Titles and values: a warm near-black */
  ink: '#2b2a20',
  /** Labels and secondary text */
  inkMuted: '#7a7466',
  /** Thin outlines on cream */
  line: 'rgba(43, 42, 32, 0.12)',
  terracotta: '#d4553a',
  coral: '#ea8a6e',
  blush: '#f5d8d0',
  sand: '#e8dccd',
  butter: '#f2dc9a',
  olive: '#6c6a3a',
  oliveDark: '#57552d',
  leaf: '#7f8a45',
} as const;

/**
 * The colours of one info tile: its background, the organic shape at its right, the circle behind its
 * icon, the icon, and the words (`light` on dark tiles)
 */
export type TileTone = { background: string; shape: string; circle: string; icon: string; light: boolean };

/**
 * The tiles' colours, used in turn: six warm tints close to each other (sand, blush, butter, tan, rose, sage),
 * each a little lighter than the page so the squares stand apart discreetly, with the mockup's accents in their
 * shapes and icon circles (olive, coral, leaf green, terracotta, pink, dark olive)
 */
export const TILE_TONES: readonly TileTone[] = [
  { background: '#efdcc2', shape: botanical.olive, circle: '#e2cdb0', icon: botanical.olive, light: false },
  { background: '#f1d6c6', shape: botanical.coral, circle: '#ecc0b1', icon: botanical.terracotta, light: false },
  { background: '#f0deb0', shape: botanical.leaf, circle: '#e6cf8f', icon: botanical.olive, light: false },
  { background: '#f2dcbc', shape: botanical.terracotta, circle: botanical.terracotta, icon: '#ffffff', light: false },
  { background: '#f0d0c2', shape: '#e86f50', circle: '#eab8a9', icon: botanical.terracotta, light: false },
  { background: '#e4dbb8', shape: botanical.oliveDark, circle: botanical.olive, icon: botanical.cream, light: false },
];

/** The tone of the tile at `index` (they repeat after six) */
export const tileTone = (index: number) => TILE_TONES[index % TILE_TONES.length];

/** A serif for plant names and tile values (the system's: Georgia on iPhone and the web, Noto Serif on Android) */
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

/** Small uppercase labels above values («WIND», «ΣΠΟΡΑ:») */
export const smallCaps = { fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' } as const;

/** Section titles on the plant page («Περιγραφή», «Τι να προσέχεις»): the serif, a size up */
export const sectionTitle = { fontFamily: serif, fontSize: 24, lineHeight: 30, color: botanical.ink } as const;

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
