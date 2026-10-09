import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import type { FontSize } from '@/theme';

const LETTER_DELAY_MS = 40;
/** How far below its place a letter starts */
const RISE = 6;

type LetterProps = {
  letter: string;
  index: number;
  size?: FontSize;
  bold?: boolean;
  color?: string;
  letterStyle?: StyleProp<TextStyle>;
};

/**
 * One letter: rises into its place and springs to full size once, after the letters before it.
 * Only transforms move (no layout animation), so the row keeps every letter in its place, and the
 * rise never overshoots: a letter can't end below or above its line.
 */
function Letter({ letter, index, size, bold, color, letterStyle }: LetterProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(index * LETTER_DELAY_MS, withSpring(1, { damping: 11, stiffness: 190 })));
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
      <AppText size={size} bold={bold} color={color} style={letterStyle}>
        {letter}
      </AppText>
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
