// The app's look in one place: the plant page's colours, corner radii, shadows and background flowers. Edit a
// value here and the whole app follows. No imports, so anything can use it; components read it through `@/theme`.

/** The palette: the page's background and its elements (text, outlines, pills, accents) */
export const botanical = {
  /** The page behind everything: the mockup's warm beige */
  page: '#f1e9de',
  /** Lighter cream for pills, rows and buttons on the page */
  cream: '#f7ebd8',
  /** Titles and values: a warm near-black */
  ink: '#2b2a20',
  /** Labels and secondary text */
  inkMuted: '#7a7466',
  /** Secondary body text elsewhere in the app: inkMuted a step darker, so long text reads on cream (4.9:1) */
  inkSoft: '#6b6558',
  /** Thin outlines on cream */
  line: 'rgba(43, 42, 32, 0.12)',
  /** Fainter dividers inside a box */
  lineSoft: 'rgba(43, 42, 32, 0.1)',
  /** Cream pills over a photo or a leaf (the dots), and a lighter one (the durations) */
  creamPill: 'rgba(251, 247, 241, 0.85)',
  creamPillSoft: 'rgba(251, 247, 241, 0.75)',
  /** Secondary text on dark tiles */
  creamMuted: 'rgba(251, 247, 241, 0.8)',
  /** Darkens a group of stages as it goes behind another */
  shade: '#000000',
  terracotta: '#d6745f',
  coral: '#ea8a6e',
  blush: '#f5d8d0',
  sand: '#e8dccd',
  butter: '#f2dc9a',
  olive: '#6c6a3a',
  /** A pale olive behind olive text: selected chips, badges */
  oliveSoft: '#ecead2',
  oliveDark: '#57552d',
  leaf: '#7f8a45',
  white: '#ffffff',
  /** Errors in forms: a deep terracotta red */
  danger: '#b5462f',
  /** Links to blogs inside texts */
  link: '#1a63bb',
} as const;

/** The sun icon: its rays by part of the day, and its horizon line */
export const sunColors = {
  morning: '#f2c46a',
  noon: '#e8a63a',
  afternoon: '#e07b3a',
  horizon: botanical.inkMuted,
} as const;

/**
 * The three colours of the squares in the info grid (the sunlight square and the tiles after it), from the
 * mockup: beige, pink and yellow. Each has its background, the colour of the decorations in the same family (rows and notes), the circle
 * behind its icon and the icon.
 */
export const GRID_TILE_TONES: readonly TileTone[] = [
  { background: '#ede0d2', shape: botanical.olive, circle: '#e0d0bd', icon: botanical.olive, light: false },
  { background: '#f0c9b8', shape: botanical.coral, circle: '#e9b09d', icon: botanical.terracotta, light: false },
  { background: '#f3d89b', shape: botanical.leaf, circle: '#e8c97e', icon: botanical.olive, light: false },
];

/** The colours of everything coloured on the plant page (tiles, rows, notes, chips, buttons…): the same three, used in turn */
export const TILE_TONES = GRID_TILE_TONES;

/**
 * The colour of one square: looks random but is worked out from the plant and the square, so a plant's page
 * keeps the same colours each time it is shown (and not the same colour for every square)
 */
export const gridTileIndex = (plantId: number, index: number) =>
  Math.abs(Math.imul(plantId + 1, 2654435761) ^ Math.imul(index + 7, 40503)) % GRID_TILE_TONES.length;

/** Corner radii (px), taken from the plant page; `theme/spacing.ts` maps the app's `radius` names onto them */
export const botanicalRadius = {
  /** Tags and small badges (the read-time badge) */
  xs: 6,
  /** Small separate elements: search results and their headers, small inputs */
  sm: 10,
  /** Buttons, fields, the carousel's photos */
  md: 14,
  /** Cards, rows, blocks and tiles (the plant page's squares) */
  tile: 20,
  /** The circle behind a tile's or row's icon */
  circle: 22,
  /** Pills, chips, tabs (fully round) */
  full: 9999,
} as const;

/** The warm brown every shadow is tinted with */
const SHADOW_COLOR = '#5a3a1a';

type ShadowSpec = { opacity: number; offsetY: number; radius: number; elevation: number };

/**
 * The app's shadows, all the same warm brown: `tile` under squares, rows and cards (so each stands apart from
 * the page), `soft` under chips and tabs, `lifted` under sheets and the opened photo
 */
const SHADOWS = {
  tile: { opacity: 0.18, offsetY: 3, radius: 8, elevation: 3 },
  soft: { opacity: 0.12, offsetY: 1, radius: 3, elevation: 1 },
  lifted: { opacity: 0.28, offsetY: 12, radius: 30, elevation: 12 },
} as const satisfies Record<string, ShadowSpec>;

const shadowStyleOf = ({ opacity, offsetY, radius, elevation }: ShadowSpec) =>
  ({
    shadowColor: SHADOW_COLOR,
    shadowOpacity: opacity,
    shadowOffset: { width: 0, height: offsetY },
    shadowRadius: radius,
    elevation,
  }) as const;

const shadowCssOf = ({ opacity, offsetY, radius }: ShadowSpec, upwards = false) => {
  const channel = (i: number) => parseInt(SHADOW_COLOR.slice(1 + i * 2, 3 + i * 2), 16);
  return `0 ${upwards ? -offsetY : offsetY}px ${radius}px rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${opacity})`;
};

/**
 * Each shadow in its two forms. `style` (shadow props and elevation) for the outer view of a square, a row or a
 * block whose inner view clips its shapes (which would cut a shadow); the view needs its own background and
 * corner radius for the shadow to show on Android. `css` (a `boxShadow` string) for views that don't clip.
 */
export const warmShadow = {
  tile: { style: shadowStyleOf(SHADOWS.tile), css: shadowCssOf(SHADOWS.tile) },
  soft: { style: shadowStyleOf(SHADOWS.soft), css: shadowCssOf(SHADOWS.soft) },
  lifted: { style: shadowStyleOf(SHADOWS.lifted), css: shadowCssOf(SHADOWS.lifted) },
  /** A bottom sheet's, casting upwards */
  sheetCss: shadowCssOf(SHADOWS.lifted, true),
} as const;

/** The tiles' discreet shadow */
export const tileShadow = { color: SHADOW_COLOR, ...SHADOWS.tile } as const;

/** The tile shadow as a style (see `warmShadow`) */
export const tileShadowStyle = warmShadow.tile.style;

/** One painted shape at the screen's edge: `y` is where it sits from the top of its repeating pattern, `center` a flower's heart */
export type BackgroundDecoration = {
  kind: 'flower' | 'leaf';
  size: number;
  color: string;
  center?: string;
  opacity: number;
  rotate: number;
  side: 'left' | 'right';
  y: number;
};

/** The plant page's faint shapes at the screen's edges, from the top of their pattern down (it repeats as the page scrolls) */
export const BACKGROUND_DECORATIONS: readonly BackgroundDecoration[] = [
  { kind: 'flower', size: 220, color: botanical.blush, opacity: 0.7, rotate: -14, side: 'right', y: 250 },
  { kind: 'leaf', size: 180, color: botanical.sand, opacity: 0.85, rotate: -35, side: 'left', y: 650 },
  { kind: 'flower', size: 170, color: botanical.butter, opacity: 0.6, rotate: 20, side: 'right', y: 1050 },
  { kind: 'flower', size: 150, color: botanical.blush, opacity: 0.6, rotate: 40, side: 'left', y: 1400 },
];

/** How the background shapes move: see `components/layout/botanical-background.tsx` */
export const BACKGROUND_MOTION = {
  /** How fast the shapes drift up as the page scrolls (a share of its speed) */
  drift: 0.5,
  /** How tall their repeating pattern is */
  pattern: 1600,
  /** How far a shape at the top or bottom of the screen is pushed out past its edge: a share of its width */
  push: 0.6,
  /** How much of a shape shows past the screen's edge while it is in the middle of the screen */
  shown: 0.75,
} as const;

/** The flower behind the plant's name, and the two flowers either side of the plant page's photo */
export const TITLE_FLOWER = { size: 170, turn: 0.06 } as const;
export const HEADER_FLOWERS = { left: { size: 170, turn: -0.06 }, right: { size: 140, turn: 0.06 } } as const;

/** The flowers in the info squares, a little more intense than the page's accents: a coral daisy (beige squares), the round flower (pink squares) and an apricot cosmos (yellow squares) */
export const TILE_FLOWER_COLORS = { daisy: '#f07147', flower: '#f57049', cosmos: '#f88a36' } as const;

/** How rough a tile's paper is: the opacity of the grain texture over it (0 = smooth, 1 = full) */
export const tileGrain = 0.45;

/** The tiles' small animations: the same warm earthy family as the page (leaves olive, pots terracotta) */
export const artColors = {
  leaf: botanical.leaf,
  leafDark: botanical.oliveDark,
  leafSoft: '#a9b36b',
  leafPale: '#c9d3a8',
  stem: botanical.olive,
  wood: '#8b6b4a',
  pot: botanical.coral,
  potDark: botanical.terracotta,
  tomato: botanical.terracotta,
  gray: '#b9ab97',
  grayLight: '#ddd0bd',
  steel: botanical.inkMuted,
  sun: '#e8a63a',
  sky: '#a9b36b',
  snow: '#c9d3a8',
  petal: botanical.coral,
  petalStrong: '#e86f50',
  flowerCentre: botanical.butter,
  petalLight: botanical.blush,
  orange: botanical.coral,
  glow: '#f5d8a8',
  white: botanical.cream,
} as const;

/**
 * The colours of one info tile: its background, the organic shape at its right, the circle behind its
 * icon, the icon, and the words (`light` on dark tiles)
 */
export type TileTone = { background: string; shape: string; circle: string; icon: string; light: boolean };

/**
 * The other pages' shapes (lists, posts, blogs, profile, sign-in): more of them and more coloured than the plant
 * page's (which has its tiles for colour), in the tiles' flower colours with contrasting hearts, a little smaller
 * so they cover less of the page. From the top of their pattern down; it repeats as the page scrolls.
 */
export const PAGE_DECORATIONS: readonly BackgroundDecoration[] = [
  { kind: 'flower', size: 170, color: botanical.coral, center: botanical.butter, opacity: 0.85, rotate: -14, side: 'right', y: 170 },
  { kind: 'leaf', size: 140, color: artColors.leafSoft, opacity: 0.75, rotate: -35, side: 'left', y: 340 },
  { kind: 'flower', size: 130, color: botanical.butter, center: botanical.terracotta, opacity: 0.9, rotate: 18, side: 'left', y: 520 },
  { kind: 'flower', size: 160, color: botanical.terracotta, center: botanical.butter, opacity: 0.8, rotate: 30, side: 'right', y: 700 },
  { kind: 'leaf', size: 120, color: artColors.leafSoft, opacity: 0.7, rotate: 140, side: 'right', y: 870 },
  { kind: 'flower', size: 145, color: TILE_FLOWER_COLORS.cosmos, center: botanical.butter, opacity: 0.8, rotate: -24, side: 'left', y: 1030 },
  { kind: 'flower', size: 175, color: botanical.blush, center: botanical.coral, opacity: 0.95, rotate: 8, side: 'right', y: 1220 },
  { kind: 'flower', size: 115, color: TILE_FLOWER_COLORS.daisy, center: botanical.butter, opacity: 0.8, rotate: 40, side: 'left', y: 1390 },
  { kind: 'leaf', size: 135, color: botanical.leaf, opacity: 0.55, rotate: -60, side: 'right', y: 1560 },
];
