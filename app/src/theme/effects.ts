import { botanical, warmShadow } from '@/config/botanical-theme';

import { alpha, colors } from './colors';

/** Shadows as CSS box-shadow strings (React Native `boxShadow`), all the plant page's warm brown (config/botanical-theme.ts) */
export const shadow = {
  /** Raised tile: icon buttons and the selected bottom tab */
  raised: warmShadow.tile.css,
  /** Cards over photos */
  card: warmShadow.tile.css,
  /** Small lift for tabs and chips */
  small: warmShadow.soft.css,
  /** Tiles on the page (a plant's characteristics) */
  tile: warmShadow.tile.css,
  /** Bottom sheet, casting upwards */
  sheet: warmShadow.sheetCss,
  /** Buttons */
  button: warmShadow.tile.css,
  /** The opened photo and dialogs */
  lifted: warmShadow.lifted.css,
} as const;

/**
 * The same shadows as styles (shadow props and elevation), for the outer view of a card whose inner view clips
 * its content: a `boxShadow` on a clipped view would be cut
 */
export const shadowStyle = {
  tile: warmShadow.tile.style,
  soft: warmShadow.soft.style,
  lifted: warmShadow.lifted.style,
} as const;

/** Faint outline that separates cream surfaces from a busy background */
export const outline = botanical.line;

/** Dimmed backdrop behind sheets and dialogs */
export const backdrop = alpha(colors.ink, 0.3);

/** Darker edge and text shadow on colored buttons (the fill color shows through) */
export const shade = alpha(colors.ink, 0.2);
