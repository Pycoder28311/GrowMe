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

/** Corner radius (px) */
export const radius = {
  /** Buttons */
  sm: 12,
  /** Cards */
  md: 16,
  /** Chips, tabs, badges (fully round) */
  full: 9999,
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
