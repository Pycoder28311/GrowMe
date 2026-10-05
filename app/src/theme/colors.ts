/** App colors (from the Plant demo design). Mobile only, light theme. */
export const colors = {
  /** Main green: titles, links, active elements */
  primary: '#2f7a3e',
  /** Light green background: selected chips, badges */
  primarySoft: '#dcefe0',
  /** Orange: the main call-to-action button */
  accent: '#f28c28',
  /** Main text */
  ink: '#1f3d24',
  /** Secondary text (ink at 70%) */
  inkMuted: 'rgba(31, 61, 36, 0.7)',
  /** Screen and card background */
  surface: '#ffffff',
  /** Borders and dividers */
  border: '#e5e7eb',
} as const;

export type ColorName = keyof typeof colors;

/** A theme color with transparency, e.g. alpha(colors.surface, 0.9) for a see-through white */
export function alpha(hex: string, opacity: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
}
