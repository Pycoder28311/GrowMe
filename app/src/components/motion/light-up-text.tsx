import type { RichDoc } from '@growme/shared';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { RichText } from '@/components/wiki/rich-text';

/** The warm light the letters glow with for a moment */
const GLOW = '#f6c453';
const GLOW_MS = 900;

/**
 * A formatted text whose letters light up for a moment when `play` turns true, then settle to their
 * normal colours: a glowing copy of the same text lies over it and fades away. Links work as usual.
 */
export function LightUpText({ doc, play }: { doc: RichDoc; play: boolean }) {
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
      <RichText doc={doc} />
      {/* The same letters, glowing; it doesn't take touches, so links stay tappable */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, overlay]}>
        <RichText doc={doc} tint={styles.glow} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    color: GLOW,
    textShadowColor: GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
