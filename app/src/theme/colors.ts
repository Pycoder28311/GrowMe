import { botanical } from '@/config/botanical-theme';

/** App colors: the plant page's botanical palette (config/botanical-theme.ts) under the app's names. Light theme only. */
export const colors = {
  /** Main colour: titles, links, active elements (olive) */
  primary: botanical.olive,
  /** Light olive background: selected chips, badges */
  primarySoft: botanical.oliveSoft,
  /** The main call-to-action button (terracotta) */
  accent: botanical.terracotta,
  /** Links to blogs inside texts (blue, so they read as links) */
  link: botanical.link,
  /** Main text */
  ink: botanical.ink,
  /** Secondary text */
  inkMuted: botanical.inkSoft,
  /** The page behind everything: warm beige */
  page: botanical.page,
  /** Cards, sheets, buttons and fields on the page */
  surface: botanical.cream,
  /** Borders and dividers */
  border: botanical.sand,
  /** Errors in forms */
  danger: botanical.danger,
  /** Dark gradients over photos, so white text on them reads */
  overlay: '#000000',
  /** Plain white (text and icons over photos and dark gradients) */
  white: botanical.white,
  /** Text and icons on the terracotta button (large and bold only: 3.2:1) */
  onAccent: botanical.white,
  /** Seed stages of a life cycle (before the plant is sold ready to plant): sand background and dot */
  seedSoft: '#f4ead6',
  seed: '#b07d33',
} as const;

export type ColorName = keyof typeof colors;

/** A theme color with transparency, e.g. alpha(colors.surface, 0.9) for a see-through cream (a `#rrggbb` or `#rrggbbaa` colour) */
export function alpha(hex: string, opacity: number) {
  const value = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
}

/** Gray of form controls (the photo button, a focused field's border), like an email form */
export const formGray = botanical.inkMuted;
/** Quiet surfaces: list headers, tabs, badges, gaps between sections */
export const quietGray = botanical.sand;
