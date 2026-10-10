import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  FLIGHT_FADE_MS,
  FLIGHT_REDUCED_MS,
  LENS_FLY_EASING,
  LENS_FLY_SHARE,
  LENS_ICON_FADE_SHARE,
  LENS_OPEN_EASING,
  LENS_STROKE_GROWTH,
  LENS_ZOOM_MS,
  lensFlyPoint,
  type Rect,
} from '@/config/search-motion';
import { alpha, colors, radius, shadow } from '@/theme';

/** The search glyph as the flight draws it: a ring and a handle (the bar's 24 px Material glyph) */
export const GLYPH = { lens: 5.5, stroke: 2, handle: 6.5 };

/** The page under the overlay mounts for a moment before it fades */
const PAGE_MOUNT_MS = 120;

export type LensFlightSpec = {
  /** The lens's centre where the flight starts (the glyph in the open bar) */
  glyph: { x: number; y: number };
  /** Which way the glyph's handle points, in degrees (0 = right, 90 = down) */
  handleAngle: number;
  /** The tapped result on screen */
  rect: Rect;
  /** A copy of the result, drawn at `rect` */
  front: ReactNode;
  /** The page the lens opens onto, screen-sized */
  preview: ReactNode;
};

const mix = (from: number, to: number, t: number) => {
  'worklet';
  return from + (to - from) * t;
};

/**
 * A search result opening into its page through the search glyph's lens (the Portfolio's search-bar
 * effect 6): the glyph flies from the bar into the result on an arc; then the result grows to the
 * whole screen while its face fades, and the page opens out of the glyph's lens, the ring growing with
 * the opening until it passes the screen's edges and fades. `onLanded` opens the real page under it,
 * then the overlay fades and `onDone` removes it. With Reduce Motion the page only fades in.
 */
export function LensFlight({ flight, onLanded, onDone }: { flight: LensFlightSpec; onLanded: () => void; onDone: () => void }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const reduced = useReducedMotion();
  const fly = useSharedValue(reduced ? 1 : 0);
  const open = useSharedValue(reduced ? 1 : 0);
  const shown = useSharedValue(reduced ? 0 : 1);

  const { rect, glyph, handleAngle } = flight;
  const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  // The lens ends past the farthest corner of the screen
  const reach =
    Math.max(
      Math.hypot(centre.x, centre.y),
      Math.hypot(screenW - centre.x, centre.y),
      Math.hypot(centre.x, screenH - centre.y),
      Math.hypot(screenW - centre.x, screenH - centre.y),
    ) * 1.05;

  useEffect(() => {
    const land = () => onLanded();
    const done = () => onDone();
    const fadeAway = withDelay(
      PAGE_MOUNT_MS,
      withTiming(0, { duration: FLIGHT_FADE_MS }, (finished) => {
        if (finished) scheduleOnRN(done);
      }),
    );
    if (reduced) {
      shown.set(
        withTiming(1, { duration: FLIGHT_REDUCED_MS }, (finished) => {
          if (finished) {
            scheduleOnRN(land);
            shown.set(fadeAway);
          }
        }),
      );
      return;
    }
    const flyMs = LENS_ZOOM_MS * LENS_FLY_SHARE;
    fly.set(withTiming(1, { duration: flyMs, easing: Easing.bezier(...LENS_FLY_EASING) }));
    open.set(
      withDelay(
        flyMs,
        withTiming(1, { duration: LENS_ZOOM_MS - flyMs, easing: Easing.bezier(...LENS_OPEN_EASING) }, (finished) => {
          if (finished) {
            scheduleOnRN(land);
            shown.set(fadeAway);
          }
        }),
      ),
    );
    // One flight per mount (FlightProvider keys each one)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlay = useAnimatedStyle(() => ({ opacity: shown.get() }));

  // The result growing to the screen
  const card = useAnimatedStyle(() => {
    const o = open.get();
    return {
      left: mix(rect.left, 0, o),
      top: mix(rect.top, 0, o),
      width: mix(rect.width, screenW, o),
      height: mix(rect.height, screenH, o),
      borderRadius: mix(radius.md, 0, o),
    };
  });
  // Its face, growing with it from the top left and fading as the page arrives
  const face = useAnimatedStyle(() => {
    const o = open.get();
    return { opacity: 1 - o, transform: [{ scale: mix(rect.width, screenW, o) / rect.width }] };
  });

  // The opening: a circle at the result's centre, as big as the glyph's lens, growing past the screen.
  // It is held back until the glyph has arrived, so the page never shows before what reveals it.
  const lensRadius = (o: number) => {
    'worklet';
    return mix(GLYPH.lens, reach, o);
  };
  const lens = useAnimatedStyle(() => {
    const o = open.get();
    const r = lensRadius(o);
    // In the card's coordinates (the card clips it)
    const cardLeft = mix(rect.left, 0, o);
    const cardTop = mix(rect.top, 0, o);
    return {
      opacity: fly.get() >= 1 ? 1 : 0,
      left: centre.x - r - cardLeft,
      top: centre.y - r - cardTop,
      width: 2 * r,
      height: 2 * r,
      borderRadius: r,
    };
  });
  // The page inside the circle stays fixed on the screen while the circle grows
  const page = useAnimatedStyle(() => {
    const r = lensRadius(open.get());
    return { left: -(centre.x - r), top: -(centre.y - r) };
  });

  // The glyph, in front of everything: along the arc, then growing with the lens and fading
  const at = () => {
    'worklet';
    return lensFlyPoint(glyph, centre, fly.get());
  };
  const stroke = () => {
    'worklet';
    return mix(GLYPH.stroke, GLYPH.stroke * LENS_STROKE_GROWTH, open.get());
  };
  const glyphFade = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, open.get() / LENS_ICON_FADE_SHARE) }));
  const ring = useAnimatedStyle(() => {
    const p = at();
    const r = lensRadius(open.get());
    return { left: p.x - r, top: p.y - r, width: 2 * r, height: 2 * r, borderRadius: r, borderWidth: stroke() };
  });
  const handle = useAnimatedStyle(() => {
    const p = at();
    const r = lensRadius(open.get());
    const s = r / GLYPH.lens;
    const w = stroke();
    const angle = (handleAngle * Math.PI) / 180;
    return {
      left: p.x + Math.cos(angle) * (r - w / 2),
      top: p.y + Math.sin(angle) * (r - w / 2) - w / 2,
      width: GLYPH.handle * s,
      height: w,
      borderRadius: w / 2,
      transform: [{ rotate: `${handleAngle}deg` }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay, overlay]}>
      {/* The search's veil stays while the result opens */}
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
      <Animated.View style={[styles.card, card]}>
        <Animated.View style={[styles.face, { width: rect.width, height: rect.height }, face]}>{flight.front}</Animated.View>
        <Animated.View style={[styles.lens, lens]}>
          <Animated.View style={[styles.page, page]}>{flight.preview}</Animated.View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, glyphFade]}>
        <Animated.View style={[styles.ring, ring]} />
        <Animated.View style={[styles.handle, handle]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 100,
  },
  veil: {
    backgroundColor: alpha(colors.surface, 0.92),
  },
  card: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  // Scaled from its top left, so it grows with the card's corner
  face: {
    transformOrigin: 'top left',
  },
  lens: {
    position: 'absolute',
    overflow: 'hidden',
  },
  page: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderColor: colors.ink,
  },
  // Rotated about its start, on the ring's edge
  handle: {
    position: 'absolute',
    backgroundColor: colors.ink,
    transformOrigin: 'left center',
  },
});
