import { useImperativeHandle, type Ref } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { SendIcon } from '@/components/ui/send-icon';
import { colors, iconSize, radius, shadow, size } from '@/theme';

/**
 * The flight, a smooth glide on a gentle curve (a quadratic Bézier, in screen widths): off to the
 * right, climbing a little. Its speed eases in and out, the nose gently follows the curve,
 * and it shrinks a little and fades at the very end, as if flying away.
 */
const FLY_MS = 1500;
const FLY_EASING = Easing.bezier(0.45, 0.05, 0.3, 1);
/**
 * The curve's control point and end, as fractions of the screen width (y down is positive): mostly to
 * the right with a gentle climb, the control point close to the straight line so it bows only a little
 */
const CONTROL = { x: 0.26, y: -0.08 };
const END = { x: 0.45, y: -0.32 };
/** How much of the curve's turn the nose follows (1 = all of it) */
const NOSE_FOLLOW = 0.45;

export type PaperPlaneHandle = { fly: () => void };

/**
 * The question form's send button: a round button with an outline paper plane (the direct-message look).
 * `fly()` sends the plane gliding off to the right of the screen, and a new one pops in at its place.
 */
export function PaperPlane({ onPress, busy, ref }: { onPress: () => void; busy?: boolean; ref?: Ref<PaperPlaneHandle> }) {
  const reduced = useReducedMotion();
  // Far enough to leave the screen from anywhere on it
  const distance = useWindowDimensions().width;
  const away = useSharedValue(0); // 0 resting → 1 gone
  const fresh = useSharedValue(1); // the new plane's pop: 0.6 → 1

  useImperativeHandle(ref, () => ({
    fly: () => {
      if (reduced) return;
      away.set(0);
      away.set(
        withSequence(
          withTiming(1, { duration: FLY_MS, easing: FLY_EASING }),
          // Back home unseen, then the new one pops in
          withTiming(0, { duration: 0 }),
        ),
      );
      fresh.set(0);
      fresh.set(withDelay(FLY_MS + 60, withSpring(1, { damping: 12, stiffness: 160 })));
    },
  }));

  const planeStyle = useAnimatedStyle(() => {
    const t = away.get();
    // While flying it is the old plane; at home it is the new one popping in (`fresh`)
    const flying = t > 0;
    const pop = fresh.get();
    // The point on the curve (start at 0,0) and its direction there
    const u = 1 - t;
    const x = (2 * u * t * CONTROL.x + t * t * END.x) * distance;
    const y = (2 * u * t * CONTROL.y + t * t * END.y) * distance;
    const dx = 2 * u * CONTROL.x + 2 * t * (END.x - CONTROL.x);
    const dy = 2 * u * CONTROL.y + 2 * t * (END.y - CONTROL.y);
    const startAngle = Math.atan2(CONTROL.y, CONTROL.x);
    const turn = ((Math.atan2(dy, dx) - startAngle) * 180) / Math.PI;
    return {
      opacity: flying ? (t >= 1 ? 0 : t > 0.8 ? (1 - t) / 0.2 : 1) : Math.min(1, pop * 2),
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${turn * NOSE_FOLLOW}deg` },
        { scale: flying ? 1 - 0.25 * t : 0.6 + 0.4 * pop },
      ],
    };
  });

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Αποστολή ερώτησης"
      accessibilityState={{ busy }}
      onPress={onPress}
      pressedScale={0.94}
      style={[styles.button, busy && styles.busy]}>
      <View collapsable={false}>
        <Animated.View style={planeStyle}>
          <SendIcon size={iconSize.big} color={colors.surface} />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    boxShadow: shadow.button,
    overflow: 'visible',
  },
  busy: {
    opacity: 0.6,
  },
});
