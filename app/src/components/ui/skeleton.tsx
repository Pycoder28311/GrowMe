import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { quietGray, radius } from '@/theme';

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  style?: StyleProp<ViewStyle>;
};

/** A gray bar or block standing where text or an image will be: it pulses softly while a page loads */
export function Skeleton({ width = '100%', height, style }: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    pulse.set(withRepeat(withTiming(0.55, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [reduced, pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.xs, backgroundColor: quietGray }, animated, style]}
    />
  );
}
