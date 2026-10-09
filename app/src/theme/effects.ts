import { alpha, colors } from './colors';

/** Shadows as CSS box-shadow strings (React Native `boxShadow`), tinted with the text color */
export const shadow = {
  /** Raised white tile: icon buttons and the selected bottom tab */
  raised: `0 4px 12px ${alpha(colors.ink, 0.14)}, 0 1px 3px ${alpha(colors.ink, 0.1)}`,
  /** Cards over photos */
  card: `0 3px 10px ${alpha(colors.ink, 0.1)}`,
  /** Small lift for tabs */
  small: `0 1px 2px ${alpha(colors.ink, 0.1)}`,
  /** White tiles on the page (a plant's characteristics): a small shadow below */
  tile: `0 2px 6px ${alpha(colors.ink, 0.1)}`,
  /** Bottom sheet, casting upwards */
  sheet: `0 -8px 30px ${alpha(colors.ink, 0.12)}`,
  /** Buttons */
  button: `0 2px 6px -1px ${alpha(colors.ink, 0.25)}`,
} as const;

/** Faint outline that separates white surfaces from a busy background */
export const outline = alpha(colors.ink, 0.05);

/** Dimmed backdrop behind sheets and dialogs */
export const backdrop = alpha(colors.ink, 0.3);

/** Darker edge and text shadow on colored buttons (the fill color shows through) */
export const shade = alpha(colors.ink, 0.2);
