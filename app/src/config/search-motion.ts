// The search bar's motion (components/search), copied from the Portfolio project's navbar search so
// both move the same way. Source (read only, never changed from here):
//   Personal/Portfolio/src/shared/zoom/navbar/navbarGeometry.js   timings, curves, helpers
//   Personal/Portfolio/src/shared/zoom/navbar/navbarSearch.css    the icon's sweep and turn
//   Personal/Portfolio/src/shared/zoom/reelCard/reelCardMotion.js the tapped result's flight
// All durations are milliseconds; curves are cubic-bezier control points.

export type Bezier = [number, number, number, number];

/** The bar grows from the icon to the leaf (SEARCH_EXPAND_MS, SEARCH_EASING) */
export const EXPAND_MS = 1200;
export const EXPAND_EASING: Bezier = [0.22, 1, 0.28, 1];

/** The icon sweeps across the open bar, turning a quarter (SEARCH_TRAVEL_MS, the glyph transition) */
export const TRAVEL_MS = 520;
export const GLYPH_EASING: Bezier = [0.65, 0, 0.35, 1];
export const GLYPH_TURN_DEG = 90;

/** The sweep sets off this long before the bar reaches the leaf (SEARCH_ICON_LEAD_MS) */
export const ICON_LEAD_MS = 400;
/** The bar counts as arrived within this many px (CONTACT_EPSILON) */
const CONTACT_EPSILON = 1;
/** How much of the sweep one placeholder letter takes to appear, in px (PLACEHOLDER_REVEAL_SPAN) */
export const PLACEHOLDER_REVEAL_SPAN = 26;
/** A placeholder letter drops this far into place (navbar-placeholder-reveal) */
export const PLACEHOLDER_DROP = 7;

/** Result rows: arriving, leaving, and moving to a new place (RESULT_*) */
export const RESULT_ENTER_MS = 320;
export const RESULT_ENTER_EASING: Bezier = [0.16, 1.18, 0.4, 1];
export const RESULT_ENTER_SCALE = 0.72;
export const RESULT_ENTER_RISE = 14;
export const RESULT_EXIT_MS = 260;
export const RESULT_EXIT_EASING: Bezier = [0.4, 0, 0.9, 0.5];
export const RESULT_EXIT_SCALE = 0.7;
export const RESULT_EXIT_DROP = 16;
export const RESULT_MOVE_MS = 440;
export const RESULT_MOVE_EASING: Bezier = [0.32, 0.9, 0.26, 1];

/** A tapped result: turns over while growing most of the way, then settles to full screen (FLIGHT_*) */
export const FLIGHT_TURN_MS = 560;
export const FLIGHT_TURN_EASING: Bezier = [0.5, 0, 0.3, 1];
export const FLIGHT_SETTLE_MS = 420;
export const FLIGHT_SETTLE_EASING: Bezier = [0.22, 1, 0.36, 1];
export const FLIGHT_PERSPECTIVE = 1600;
export const FLIGHT_TURN_GROWTH = 0.7;
/** With Reduce Motion on, a tapped result only fades (FLIGHT_REDUCED_MS) */
export const FLIGHT_REDUCED_MS = 180;
/** The overlay fades away once the page under it has mounted */
export const FLIGHT_FADE_MS = 150;

/* ─────────────── Helpers (ported from navbarGeometry.js / reelCardMotion.js) ─────────────── */

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const cubicCoordinate = (value: number, firstControl: number, secondControl: number) => {
  const inverse = 1 - value;
  return 3 * inverse * inverse * value * firstControl + 3 * inverse * value * value * secondControl + value * value * value;
};

/** How far into a curve's time the curve reaches `progress` of its distance (0–1) */
export function easedTimeAtProgress(progress: number, [x1, y1, x2, y2]: Bezier) {
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const value = (low + high) / 2;
    if (cubicCoordinate(value, y1, y2) < progress) low = value;
    else high = value;
  }
  return cubicCoordinate((low + high) / 2, x1, x2);
}

/** When, into the expansion, the bar's edge is close enough to the leaf to count as arrived */
export function contactDelayMs(distance: number) {
  if (!(distance > CONTACT_EPSILON)) return 0;
  const progress = (distance - CONTACT_EPSILON) / distance;
  return easedTimeAtProgress(progress, EXPAND_EASING) * EXPAND_MS;
}

/** When, into the expansion, the icon sets off across the bar (one lead before it arrives) */
export function iconTravelStartMs(distance: number) {
  return Math.max(0, contactDelayMs(distance) - ICON_LEAD_MS);
}

/**
 * When one placeholder letter appears, from the start of the sweep: as the icon passes it.
 * `characterCenter` is measured from the bar's left edge; `controlSize` is the icon's box.
 */
export function placeholderRevealWindow(characterCenter: number, openWidth: number, controlSize: number) {
  const iconStart = openWidth - controlSize / 2;
  const iconEnd = controlSize / 2;
  const distance = Math.max(1, iconStart - iconEnd);
  const revealStart = clamp((iconStart - characterCenter) / distance, 0, 1);
  const revealEnd = Math.min(1, revealStart + PLACEHOLDER_REVEAL_SPAN / distance);
  const delayMs = easedTimeAtProgress(revealStart, GLYPH_EASING) * TRAVEL_MS;
  const endMs = easedTimeAtProgress(revealEnd, GLYPH_EASING) * TRAVEL_MS;
  return { delayMs, durationMs: Math.max(24, endMs - delayMs) };
}

export type Rect = { left: number; top: number; width: number; height: number };

const centreOf = (rect: Rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * Where the flight is when its turn completes: the row's own shape, grown `growth` of the way (in
 * scale) to the screen, and most of the way to its centre. The settle then only reshapes it.
 */
export function flightTurnRect(card: Rect, screen: Rect, growth = FLIGHT_TURN_GROWTH): Rect {
  const cardSize = Math.sqrt(card.width * card.height);
  const screenSize = Math.sqrt(screen.width * screen.height);
  if (!(cardSize > 0) || !(screenSize > 0)) return { ...screen };
  const scale = 2 ** (Math.log2(screenSize / cardSize) * growth);
  const width = card.width * scale;
  const height = card.height * scale;
  const cardCentre = centreOf(card);
  const screenCentre = centreOf(screen);
  const x = lerp(cardCentre.x, screenCentre.x, 0.85);
  const y = lerp(cardCentre.y, screenCentre.y, 0.85);
  return { left: x - width / 2, top: y - height / 2, width, height };
}

/* ─────────────── A search result opening through the lens (Portfolio search-bar/config.js) ─────────────── */
// The search glyph flies from the bar into the tapped result on an arc, then the result grows to the
// whole screen while the page opens out of the glyph's lens (scene.js, effect 6). Copied from
//   Personal/Portfolio/src/(pages)/search-bar/config.js   TIMING.zoom, EASING.fly/zoom, MOTION.fly*/lens*

/** The whole opening: the glyph's flight, then the lens opening (TIMING.zoom) */
export const LENS_ZOOM_MS = 1150;
/** The share of it spent flying to the result (MOTION.flyShare) */
export const LENS_FLY_SHARE = 0.38;
/** Leaves the bar gently, then slows into the result so the arrival reads (EASING.fly) */
export const LENS_FLY_EASING: Bezier = [0.5, 0, 0.08, 1];
/** The result growing to the screen and the lens opening (EASING.zoom) */
export const LENS_OPEN_EASING: Bezier = [0.62, 0, 0.2, 1];
/** How far the flight bends out of a straight line: it carries on along the bar, then drops in (MOTION.flyArc) */
export const LENS_FLY_ARC = 0.85;
/** How much thicker the ring is once it fills the screen (MOTION.lensStrokeGrowth) */
export const LENS_STROKE_GROWTH = 3.2;
/** The glyph is gone by this share of the opening (MOTION.iconFadeShare) */
export const LENS_ICON_FADE_SHARE = 0.45;

/** A point on the flight: a quadratic curve whose control point is pulled towards the corner (flyPoint) */
export function lensFlyPoint(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  'worklet';
  const cpx = from.x + (to.x - from.x) * (0.5 + 0.5 * LENS_FLY_ARC);
  const cpy = (from.y + to.y) / 2 + (from.y - (from.y + to.y) / 2) * LENS_FLY_ARC;
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * cpx + t * t * to.x, y: u * u * from.y + 2 * u * t * cpy + t * t * to.y };
}
