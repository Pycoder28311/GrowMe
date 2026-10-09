import { useEffect, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const BEHIND_MS = 450;

/**
 * Content that appears the first time it comes into view (`visible`): `behind` rises from slightly
 * smaller and lower, as if from behind the page; `pop` springs up. Until then it keeps its place but
 * is invisible, so nothing below it moves. With Reduce Motion it is simply shown.
 */
export function Reveal({
  from,
  visible,
  children,
  style,
}: {
  from: 'behind' | 'pop';
  visible: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!visible || reduced) return;
    progress.set(
      from === 'pop'
        ? withSpring(1, { damping: 12, stiffness: 160 })
        : withTiming(1, { duration: BEHIND_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [visible, reduced, from, progress]);

  const animated = useAnimatedStyle(() => {
    const p = progress.value;
    if (from === 'pop') return { opacity: Math.min(1, p * 1.5), transform: [{ scale: 0.85 + 0.15 * p }] };
    return { opacity: p, transform: [{ translateY: (1 - p) * 16 }, { scale: 0.92 + 0.08 * p }] };
  });

  return <Animated.View style={[style, reduced ? undefined : animated]}>{children}</Animated.View>;
}
