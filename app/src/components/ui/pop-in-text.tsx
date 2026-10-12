import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { OutlinedText } from '@/components/ui/outlined-text';
import type { FontSize } from '@/theme';

const LETTER_DELAY_MS = 40;
/** One letter's pop: quick, past full size once, then settled (no repeated bouncing) */
const POP_MS = 520;
const POP_EASING = Easing.out(Easing.back(2));
/** How far below its place a letter starts */
const RISE = 6;

type LetterProps = {
  letter: string;
  index: number;
  size?: FontSize;
  bold?: boolean;
  color?: string;
  letterStyle?: StyleProp<TextStyle>;
  /** A thick white outline round every letter, this many px thick */
  outline?: number;
};

/**
 * One letter: rises into its place and pops to full size once, after the letters before it.
 * Only transforms move (no layout animation), so the row keeps every letter in its place, and the
 * rise never overshoots: a letter can't end below or above its line.
 */
function Letter({ letter, index, size, bold, color, letterStyle, outline }: LetterProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(index * LETTER_DELAY_MS, withTiming(1, { duration: POP_MS, easing: POP_EASING })));
  }, [index, progress, reduced]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    const settled = Math.min(1, p);
    return {
      opacity: Math.min(1, p * 2),
      transform: [{ translateY: RISE * (1 - settled) }, { scale: 0.7 + 0.3 * p }],
    };
  });

  return (
    <Animated.View importantForAccessibility="no" style={style}>
      {outline ? (
        <OutlinedText size={size} bold={bold} color={color ?? '#000000'} outline={outline} style={letterStyle}>
          {letter}
        </OutlinedText>
      ) : (
        <AppText size={size} bold={bold} color={color} style={letterStyle}>
          {letter}
        </AppText>
      )}
    </Animated.View>
  );
}

type PopInTextProps = Omit<LetterProps, 'letter' | 'index'> & { text: string };

/** Text whose letters pop in one after another, left to right, in one row, when it first appears */
export function PopInText({ text, ...letterProps }: PopInTextProps) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={text} style={styles.row}>
      {Array.from(text).map((letter, index) => (
        <Letter key={index} letter={letter} index={index} {...letterProps} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
