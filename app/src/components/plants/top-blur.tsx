import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { alpha, colors } from '@/theme';

/** Over how much scroll it fades in, once the photos have passed under it */
const FADE_IN = 40;

/**
 * A blurred band behind the corner buttons and the section labels between them, so the labels stand
 * out from the page scrolling under them. It shows only once the photos have scrolled up past it
 * (`from`: the scroll at which their bottom reaches the band's lower edge), so they are never blurred.
 */
export function TopBlur({ scrollY, height, from }: { scrollY: SharedValue<number>; height: number; from: number }) {
  const shown = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (scrollY.get() - from) / FADE_IN)),
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.band, { height }, shown]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      {/* A light wash, so the labels read even where the blur is only a tint (Android) */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.wash]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  wash: {
    backgroundColor: alpha(colors.surface, 0.35),
  },
});
