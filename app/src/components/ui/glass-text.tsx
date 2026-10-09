import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { alpha, colors, space } from '@/theme';

type GlassTextProps = {
  text: string;
  /** Wait before popping in (ms), e.g. until a title above has finished */
  delayMs?: number;
  maxWidth?: number;
};

/**
 * Bold text that stands out over a photo: a soft shadow underneath, letters multiplied with the photo.
 * It pops in once (rises a little and springs to full size); only transforms move, so it never shifts
 * the layout around it.
 */
export function GlassText({ text, delayMs = 0, maxWidth }: GlassTextProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(delayMs, withSpring(1, { damping: 12, stiffness: 170 })));
  }, [delayMs, progress, reduced]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: Math.min(1, p * 2),
      transform: [{ translateY: space.sm * (1 - Math.min(1, p)) }, { scale: 0.7 + 0.3 * p }],
    };
  });

  return (
    <Animated.View style={[{ maxWidth }, style]}>
      <AppText size="big" bold color={colors.ink} style={styles.text}>
        {text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    mixBlendMode: 'multiply',
    textShadowColor: alpha(colors.ink, 0.28),
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
