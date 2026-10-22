import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { measure, useAnimatedRef, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { FlowerShape, LeafShape, PaperGrain } from '@/components/ui/flower-shapes';
import { BACKGROUND_DECORATIONS, BACKGROUND_MOTION, botanical, tileGrain, type BackgroundDecoration } from '@/theme';

const { drift: DRIFT, pattern: PATTERN, push: PUSH, shown: SHOWN } = BACKGROUND_MOTION;

/** How far out a shape whose middle is at `centerY` on screen is pushed: 0 around the middle, easing to 1 near the top or bottom */
export function edgeAway(centerY: number, screenHeight: number) {
  'worklet';
  const distance = Math.min(1, Math.abs(centerY - screenHeight / 2) / (screenHeight / 2));
  const t = Math.min(1, Math.max(0, (distance - 0.15) / 0.7));
  return t * t * (3 - 2 * t);
}

/**
 * A shape that scrolls with the page (e.g. the flower behind the plant's name) given the background shapes'
 * push: out past its `side` edge (up to PUSH of its `size`) as it nears the top or bottom of the screen, turning
 * `turn` degrees per pixel scrolled. Place it with `style` (absolute); its own box is measured, the shape inside moves.
 */
export function EdgeDrift({
  scrollY,
  side,
  size,
  turn = 0,
  style,
  children,
}: {
  scrollY: SharedValue<number>;
  side: 'left' | 'right';
  size: number;
  turn?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const box = useAnimatedRef<View>();
  const moved = useAnimatedStyle(() => {
    const scrolled = scrollY.get();
    const frame = measure(box);
    const away = frame ? edgeAway(frame.pageY + frame.height / 2, height) : 0;
    return { transform: [{ translateX: (side === 'right' ? 1 : -1) * PUSH * size * away }, { rotate: `${scrolled * turn}deg` }] };
  });
  return (
    <View ref={box} pointerEvents="none" collapsable={false} style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, moved]}>{children}</Animated.View>
    </View>
  );
}

/**
 * One shape at the screen's edge: it drifts up slower than the page, and the farther it is from the middle of
 * the screen the more it is pushed out past its edge (up to PUSH of its width), so the shapes above slide away
 * to the sides and the ones coming up from below slide in.
 */
function DriftingShape({ item, scrollY, screenHeight }: { item: BackgroundDecoration; scrollY: SharedValue<number>; screenHeight: number }) {
  const { kind, size, color, center, opacity, rotate, side } = item;
  const style = useAnimatedStyle(() => {
    // Its top on screen, wrapped round the pattern so it comes back from below
    const top = ((((item.y - scrollY.get() * DRIFT) % PATTERN) + PATTERN) % PATTERN) - size;
    const away = edgeAway(top + size / 2, screenHeight);
    return { top, transform: [{ translateX: (side === 'right' ? 1 : -1) * PUSH * size * away }] };
  });
  return (
    <Animated.View style={[styles.drifting, { width: size, height: size, [side]: -size * (1 - SHOWN) }, style]}>
      {kind === 'flower' ? (
        <FlowerShape size={size} color={color} center={center} opacity={opacity} rotate={rotate} style={styles.fill} />
      ) : (
        <LeafShape size={size} color={color} opacity={opacity} rotate={rotate} style={styles.fill} />
      )}
    </Animated.View>
  );
}

/**
 * The app's background, fixed behind a page: the botanical cream paper (a fine grain), with painted flowers and
 * leaves at its edges (`decorations`) that drift as the page scrolls (`scrollY`; see DriftingShape). The shell
 * draws it behind every page but home, with PAGE_DECORATIONS; the plant page draws its own, fainter set over it.
 */
export function BotanicalBackground({
  scrollY,
  decorations = BACKGROUND_DECORATIONS,
}: {
  scrollY?: SharedValue<number>;
  /** The shapes at the edges: the plant page's by default, PAGE_DECORATIONS (more and more coloured) elsewhere */
  decorations?: readonly BackgroundDecoration[];
}) {
  const { height } = useWindowDimensions();
  // Without a scroll (the loading skeleton, the sign-in pages) the shapes stay where the page starts
  const still = useSharedValue(0);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.page]}>
      {decorations.map((item) => (
        <DriftingShape key={item.y} item={item} scrollY={scrollY ?? still} screenHeight={height} />
      ))}
      <PaperGrain opacity={tileGrain} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: botanical.page,
    overflow: 'hidden',
  },
  drifting: {
    position: 'absolute',
  },
  fill: {
    left: 0,
    top: 0,
  },
});
