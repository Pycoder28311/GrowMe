import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';

// The info tiles' small animations: each drawing is a few SVG layers stacked in one square, and
// each layer moves on its own (rotate, translate, scale around its own pivot). Drawn on a 56×56 grid.

/** The drawings' grid and size on screen */
export const ART = 56;

/** Shared colours of the drawings */
export const ink = {
  leaf: '#6fb04a',
  leafDark: '#3f8a3a',
  stem: '#5b8a3c',
  wood: '#9a6b47',
  pot: '#c96f4a',
  potDark: '#a55536',
  tomato: '#e5483b',
  gray: '#a3a8b0',
  grayLight: '#d4d7dc',
  steel: '#8a96a3',
  sun: '#ffb627',
  sky: '#7fb8e6',
  snow: '#7fb8e6',
  petal: '#f07aa5',
  petalLight: '#f7b3cb',
  orange: '#ef8a2f',
  white: '#ffffff',
} as const;

/**
 * A 0 → 1 clock that loops while `playing` (`bounce`: back and forth, eased; else 0 → 1 again, linear).
 * Stopped, it eases back to 0 so the drawing rests in its first pose.
 */
export function useLoop(playing: boolean, ms: number, bounce = true) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!playing) {
      cancelAnimation(t);
      t.set(withTiming(0, { duration: 250 }));
      return;
    }
    t.set(0);
    t.set(withRepeat(withTiming(1, { duration: ms, easing: bounce ? Easing.inOut(Easing.sin) : Easing.linear }), -1, bounce));
    return () => cancelAnimation(t);
  }, [playing, ms, bounce, t]);
  return t;
}

/** The square a drawing sits in (no background) */
export function ArtBox({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <View accessible={!!label} accessibilityLabel={label} style={styles.box}>
      {children}
    </View>
  );
}

/** One layer of a drawing: the whole square, moved by `style` (its pivot is set there with transformOrigin) */
export function Layer({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={ART} height={ART} viewBox={`0 0 ${ART} ${ART}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** A pivot on the drawing's grid, for transformOrigin */
export const pivot = (x: number, y: number) => `${x}px ${y}px`;

const styles = StyleSheet.create({
  box: {
    width: ART,
    height: ART,
  },
});
