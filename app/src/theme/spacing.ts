import { botanicalRadius } from '@/config/botanical-theme';

/** Padding, margins and gaps (px), on a 4px grid */
export const space = {
  /** Icon next to text */
  xs: 4,
  /** Inside cards, gaps between chips */
  sm: 8,
  /** Inside buttons and chips, gaps between elements */
  md: 16,
  /** Screen side padding */
  lg: 24,
} as const;

/** Corner radius (px): the plant page's scale (config/botanical-theme.ts) */
export const radius = {
  /** Tags and small badges */
  tag: botanicalRadius.xs,
  /** Small separate elements: search results and their list headers */
  xs: botanicalRadius.sm,
  /** Buttons */
  sm: botanicalRadius.md,
  /** Cards, rows, blocks and tiles */
  md: botanicalRadius.tile,
  /** The circle behind an icon */
  circle: botanicalRadius.circle,
  /** Chips, tabs, badges (fully round) */
  full: botanicalRadius.full,
} as const;

export type Space = keyof typeof space;
export type Radius = keyof typeof radius;

/** Element sizes (px) */
export const size = {
  /** Smallest comfortable tap target: icon buttons, bottom tabs */
  touch: 48,
} as const;

/** Icon sizes (px) */
export const iconSize = {
  small: 16,
  normal: 20,
  big: 24,
} as const;
