/** App colors (from the Plant demo design). Mobile only, light theme. */
export const colors = {
  /** Main green: titles, links, active elements (5.4:1 on white) */
  primary: '#1a7a36',
  /** Light green background: selected chips, badges (the green on it: 4.5:1) */
  primarySoft: '#d4f1db',
  /** Orange: the main call-to-action button */
  accent: '#f28c28',
  /** Links to blogs inside texts (light blue, 4.7:1 on white) */
  link: '#1e73d8',
  /** Main text */
  ink: '#1f3d24',
  /** Secondary text (ink at 70%) */
  inkMuted: 'rgba(31, 61, 36, 0.7)',
  /** Screen and card background */
  surface: '#ffffff',
  /** Borders and dividers */
  border: '#e5e7eb',
  /** Seed stages of a life cycle (before the plant is sold ready to plant): sand background and dot */
  seedSoft: '#f4ead6',
  seed: '#b07d33',
} as const;

export type ColorName = keyof typeof colors;

/** A theme color with transparency, e.g. alpha(colors.surface, 0.9) for a see-through white */
export function alpha(hex: string, opacity: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
}
