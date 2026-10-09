import { useEffect, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  FLIGHT_FADE_MS,
  FLIGHT_PERSPECTIVE,
  FLIGHT_REDUCED_MS,
  FLIGHT_SETTLE_EASING,
  FLIGHT_SETTLE_MS,
  FLIGHT_TURN_EASING,
  FLIGHT_TURN_MS,
  flightTurnRect,
  type Rect,
} from "@/config/search-motion";
import { colors } from "@/theme";

/** A flight: where it starts on screen, and what it shows on its front (a copy of what was tapped) */
export type Flight = { rect: Rect; front: ReactNode };

// The page shows under the overlay before it fades: a moment for the new screen to mount
const PAGE_MOUNT_MS = 120;

/**
 * Something tapped growing into its page (the Portfolio's card flight, reelCardMotion.js): a copy of
 * it (`front`), drawn where it was, turns over while growing most of the way to the screen, then
 * settles to full screen. Its back is a plain page; `onLanded` opens the real page under it, then
 * the overlay fades away and `onDone` removes it. With Reduce Motion it only fades.
 * Used through lib/flight.tsx (search results, lifecycle stages).
 */
export function GrowFlight({
  flight,
  onLanded,
  onDone,
}: {
  flight: Flight;
  onLanded: () => void;
  onDone: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const screen: Rect = { left: 0, top: 0, width, height };
  const start = reduced ? screen : flight.rect;
  const left = useSharedValue(start.left);
  const top = useSharedValue(start.top);
  const boxWidth = useSharedValue(start.width);
  const boxHeight = useSharedValue(start.height);
  const turn = useSharedValue(reduced ? 180 : 0);
  const opacity = useSharedValue(reduced ? 0 : 1);

  useEffect(() => {
    const land = () => onLanded();
    const done = () => onDone();
    // The page under the overlay mounts, then the overlay fades and goes
    const fadeAway = (after: number) =>
      withDelay(
        after,
        withTiming(0, { duration: FLIGHT_FADE_MS }, (finished) => {
          if (finished) scheduleOnRN(done);
        }),
      );

    if (reduced) {
      opacity.value = withSequence(
        withTiming(1, { duration: FLIGHT_REDUCED_MS }, (finished) => {
          if (finished) scheduleOnRN(land);
        }),
        fadeAway(PAGE_MOUNT_MS),
      );
      return;
    }

    const middle = flightTurnRect(flight.rect, screen);
    const turnTiming = {
      duration: FLIGHT_TURN_MS,
      easing: Easing.bezier(...FLIGHT_TURN_EASING),
    };
    const settleTiming = {
      duration: FLIGHT_SETTLE_MS,
      easing: Easing.bezier(...FLIGHT_SETTLE_EASING),
    };
    const toRect = (from: Rect, to: Rect) => {
      left.value = withSequence(
        withTiming(from.left, turnTiming),
        withTiming(to.left, settleTiming),
      );
      top.value = withSequence(
        withTiming(from.top, turnTiming),
        withTiming(to.top, settleTiming),
      );
      boxWidth.value = withSequence(
        withTiming(from.width, turnTiming),
        withTiming(to.width, settleTiming),
      );
      boxHeight.value = withSequence(
        withTiming(from.height, turnTiming),
        withTiming(to.height, settleTiming, (finished) => {
          if (finished) scheduleOnRN(land);
        }),
      );
    };
    turn.value = withTiming(180, turnTiming);
    toRect(middle, screen);
    opacity.value = fadeAway(FLIGHT_TURN_MS + FLIGHT_SETTLE_MS + PAGE_MOUNT_MS);
    // One flight per mount (FlightProvider keys each flight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const box = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: boxWidth.value,
    height: boxHeight.value,
    opacity: opacity.value,
    transform: [
      { perspective: FLIGHT_PERSPECTIVE },
      { rotateY: `${turn.value}deg` },
    ],
  }));
  // The row until the turn passes edge-on, then the page's back (not left to backfaceVisibility,
  // which is unreliable on Android)
  const front = useAnimatedStyle(() => ({
    opacity: turn.value < 90 ? 1 : 0,
    transform: [{ scale: boxWidth.value / flight.rect.width }],
  }));
  const back = useAnimatedStyle(() => ({ opacity: turn.value < 90 ? 0 : 1 }));

  return (
    <Animated.View pointerEvents="none" style={[styles.flight, box]}>
      <Animated.View style={[styles.back, back]} />
      <View style={styles.center}>
        <Animated.View
          style={[
            { width: flight.rect.width, height: flight.rect.height },
            front,
          ]}
        >
          {flight.front}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flight: {
    position: "absolute",
    zIndex: 100,
  },
  back: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
