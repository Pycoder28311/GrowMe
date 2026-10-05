/** Text sizes (px) */
export const fontSize = {
  /** Labels, badges, secondary info */
  small: 12,
  /** Body text, chips, links */
  normal: 16,
  /** Titles, main button */
  big: 24,
} as const;

export const fontWeight = {
  normal: '400',
  bold: '700',
} as const;

/**
 * Source Sans 3. Not loaded yet: install @expo-google-fonts/source-sans-3 and load these
 * two weights with expo-font before using them.
 */
export const fontFamily = {
  normal: 'SourceSans3_400Regular',
  bold: 'SourceSans3_700Bold',
} as const;

export type FontSize = keyof typeof fontSize;
