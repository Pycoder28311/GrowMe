import { useImperativeHandle, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
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

import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, shadow, size } from '@/theme';

/** The flight: the plane turns 30° up and leaves towards the top right */
const FLY_MS = 480;
const FLY_DISTANCE = 140;
const TURN_DEG = -30;

export type PaperPlaneHandle = { fly: () => void };

/**
 * The question form's send button: a round button with a paper plane. `fly()` sends the plane off
 * to the top right, turned 30° up, and a new one pops in at its place.
 */
export function PaperPlane({ onPress, busy, ref }: { onPress: () => void; busy?: boolean; ref?: Ref<PaperPlaneHandle> }) {
  const reduced = useReducedMotion();
  const away = useSharedValue(0); // 0 resting → 1 gone
  const fresh = useSharedValue(1); // the new plane's pop: 0.6 → 1

  useImperativeHandle(ref, () => ({
    fly: () => {
      if (reduced) return;
      away.set(0);
      away.set(
        withSequence(
          withTiming(1, { duration: FLY_MS, easing: Easing.in(Easing.cubic) }),
          // Back home unseen, then the new one pops in
          withTiming(0, { duration: 0 }),
        ),
      );
      fresh.set(0);
      fresh.set(withDelay(FLY_MS, withSpring(1, { damping: 10, stiffness: 180 })));
    },
  }));

  const planeStyle = useAnimatedStyle(() => {
    const a = away.get();
    // Along the 30° line up and to the right
    const distance = a * FLY_DISTANCE;
    return {
      opacity: (1 - a) * Math.min(1, fresh.get() * 2),
      transform: [
        { translateX: distance * Math.cos(Math.PI / 6) },
        { translateY: -distance * Math.sin(Math.PI / 6) },
        { rotate: `${TURN_DEG * Math.min(1, a * 3)}deg` },
        { scale: 0.6 + 0.4 * fresh.get() },
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
          <Icon name="paperplane" size={iconSize.big} color={colors.surface} />
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
