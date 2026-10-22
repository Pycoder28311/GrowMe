/**
 * Colors of the screens outside the app shell (sign-in and the like), from the botanical theme.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { botanical } from '@/config/botanical-theme';

// The app is light only: both schemes use the botanical tokens (config/botanical-theme.ts)
const BOTANICAL_COLORS = {
  text: botanical.ink,
  background: botanical.page,
  backgroundElement: botanical.cream,
  backgroundSelected: botanical.sand,
  textSecondary: botanical.inkSoft,
} as const;

export const Colors = {
  light: BOTANICAL_COLORS,
  dark: BOTANICAL_COLORS,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
