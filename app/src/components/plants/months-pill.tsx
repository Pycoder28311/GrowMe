import type { MonthRange } from '@growme/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { plantingPeriod } from '@/config/plant-traits';

/** How long each range stays, and the change between two */
const SHOW_MS = 2000;
const CHANGE_MS = 350;
/** One line of small text */
const LINE = 16;

/**
 * One range's label. `position` counts up by one at every change; this label's distance from it
 * (wrapped around the list) places it: two ranges cross-fade, three or more slide like a carousel.
 */
function Label({ text, index, count, position, width }: { text: string; index: number; count: number; position: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    // Distance from the shown one, wrapped into (-count/2, count/2]
    const raw = index - position.get();
    const d = ((((raw + count / 2) % count) + count) % count) - count / 2;
    if (count === 2) return { opacity: Math.max(0, 1 - Math.abs(d)) };
    return { opacity: Math.abs(d) < 1 ? 1 - Math.abs(d) * 0.6 : 0, transform: [{ translateX: d * width }] };
  });
  return (
    <Animated.View style={[styles.layer, style]}>
      <AppText size="small" bold>
        {text}
      </AppText>
    </Animated.View>
  );
}

/**
 * A plant's planting months on its card's photo («ΜΑΡ – ΜΑΪ»), no emoji. With two ranges they swap
 * every 2 s, back and forth; with three they go round like a carousel. With Reduce Motion: the first.
 */
export function MonthsPill({ ranges }: { ranges: MonthRange[] }) {
  const reduced = useReducedMotion();
  const labels = ranges.map((range) => plantingPeriod(range).label);
  const count = labels.length;
  const moving = count > 1 && !reduced;
  const position = useSharedValue(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!moving) return;
    let next = 0;
    const timer = setInterval(() => {
      next += 1;
      position.set(withTiming(next, { duration: CHANGE_MS, easing: Easing.inOut(Easing.cubic) }));
    }, SHOW_MS);
    return () => clearInterval(timer);
  }, [moving, position]);

  if (count === 0) return null;
  if (!moving) {
    return (
      <AppText size="small" bold numberOfLines={1}>
        {labels[0]}
      </AppText>
    );
  }
  // The widest label sets the pill's size (all of them, hidden, in a one-line-tall column); the moving
  // ones sit over it
  return (
    <View accessible accessibilityLabel={labels.join(', ')} style={styles.clip} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.sizer}>
        {labels.map((text, index) => (
          <AppText key={index} size="small" bold>
            {text}
          </AppText>
        ))}
      </View>
      {labels.map((text, index) => (
        <Label key={index} text={text} index={index} count={count} position={position} width={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    height: LINE,
  },
  sizer: {
    opacity: 0,
  },
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
