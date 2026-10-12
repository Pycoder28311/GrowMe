import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { OutlinedText } from '@/components/ui/outlined-text';
import { colors, space } from '@/theme';

/** A gentle pop: from a little smaller, just past full size once, then settled */
const POP_MS = 500;
const POP_EASING = Easing.out(Easing.back(1.2));
const START_SCALE = 0.9;
/** The black border's thickness (px) round each letter, and how far the white glow spreads */
const BORDER = 1.6;
const GLOW = 40;

type GlassTextProps = {
  text: string;
  /** Wait before popping in (ms), e.g. until a title above has finished */
  delayMs?: number;
  maxWidth?: number;
};

/**
 * Bold text that stands out over a photo: white letters with a thin black border and a white glow spreading out from them.
 * It pops in once, gently (rises a little and grows to full size); only transforms move, so it never shifts
 * the layout around it.
 */
export function GlassText({ text, delayMs = 0, maxWidth }: GlassTextProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(delayMs, withTiming(1, { duration: POP_MS, easing: POP_EASING })));
  }, [delayMs, progress, reduced]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: Math.min(1, p * 2),
      transform: [{ translateY: space.xs * (1 - Math.min(1, p)) }, { scale: START_SCALE + (1 - START_SCALE) * p }],
    };
  });

  return (
    <Animated.View style={[{ maxWidth }, style]}>
      {/* White letters with a thin black border, and a white glow spreading out from them */}
      <OutlinedText
        size="big"
        bold
        color={colors.surface}
        outlineColor="#000000"
        outline={BORDER}
        glow={{ color: colors.surface, radius: GLOW }}
        style={styles.text}>
        {text}
      </OutlinedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
  },

});
