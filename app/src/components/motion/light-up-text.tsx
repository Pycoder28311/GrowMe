import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { LinkedText } from '@/components/ui/linked-text';

/** The warm light the letters glow with for a moment */
const GLOW = '#f6c453';
const GLOW_MS = 900;

/**
 * A text whose letters light up for a moment when `play` turns true, then settle to the normal ink:
 * a glowing copy of the same text lies over it and fades away. Blog links work as usual.
 */
export function LightUpText({ children, play }: { children: string; play: boolean }) {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!play || reduced) return;
    glow.set(1);
    glow.set(withDelay(150, withTiming(0, { duration: GLOW_MS })));
  }, [play, reduced, glow]);

  const overlay = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View>
      <LinkedText>{children}</LinkedText>
      {/* The same letters, glowing; it doesn't take touches, so links stay tappable */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, overlay]}>
        <LinkedText color={GLOW} style={styles.glow}>
          {children}
        </LinkedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    textShadowColor: GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
