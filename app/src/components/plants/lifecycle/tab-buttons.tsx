import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { tabDef } from '@/config/plant-page';
import { botanical, radius, serif, space, tileGrain, tileShadowStyle, tileTone, warmShadow } from '@/theme';

import type { StageGroup } from './stage-groups';

/** The track's tint: the stages' own beige */
const TRACK = tileTone(0).background;
/** The space round and between the tabs */
const INSET = space.xs;
/** The bottom bar's slide: springy, with a small overshoot */
const SLIDE = { duration: 350, easing: Easing.bezier(0.34, 1.2, 0.64, 1) };

/** The picked tab's cream pill, sliding to the tab picked and wobbling like the bottom bar's tile on the way */
function SlidingPill({ lit, width }: { lit: number; width: number }) {
  const x = useSharedValue(lit * (width + INSET));
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  // No slide until the first pick (and none when the track is resized)
  const last = useRef({ lit, width });
  useEffect(() => {
    const target = lit * (width + INSET);
    if (last.current.lit === lit) {
      x.set(target);
    } else {
      x.set(withTiming(target, SLIDE));
      const wobble = (a: number, b: number, c: number) =>
        withSequence(withTiming(a, { duration: 120 }), withTiming(b, { duration: 100 }), withTiming(c, { duration: 80 }), withTiming(1, { duration: 100 }));
      squashX.set(wobble(1.12, 0.97, 1.01));
      squashY.set(wobble(0.9, 1.04, 0.99));
    }
    last.current = { lit, width };
  }, [lit, width, x, squashX, squashY]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { scaleX: squashX.get() }, { scaleY: squashY.get() }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.pill, { width }, style]} />;
}

/**
 * The life cycle's tabs («Από σπόρο» | «Μεταφύτευση» | «Περιποίηση»), one per group the plant has, as one
 * segmented pill in the tiles' style: a beige track with paper grain and the squares' shadow, a raised cream
 * pill under the tab picked (it slides to a new pick, like the bottom bar's tile), its name in the serif, the
 * others plain muted words.
 */
export function TabButtons({ groups, lit, onPick }: { groups: readonly StageGroup[]; lit: number; onPick: (index: number) => void }) {
  // One tab's width, once the track is measured
  const [tabWidth, setTabWidth] = useState(0);
  return (
    <View style={styles.shadow}>
      <View
        accessibilityRole="tablist"
        style={styles.track}
        onLayout={(event) => setTabWidth((event.nativeEvent.layout.width - INSET * (groups.length + 1)) / groups.length)}>
        <PaperGrain opacity={tileGrain} />
        {tabWidth > 0 && <SlidingPill lit={lit} width={tabWidth} />}
        {groups.map((group, index) => {
          const { label } = tabDef(group.tab);
          const on = index === lit;
          return (
            <Pressable
              key={group.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              aria-selected={on}
              onPress={() => onPick(index)}
              style={({ pressed }) => [styles.tab, pressed && !on && styles.pressed]}>
              <AppText color={on ? botanical.ink : botanical.inkMuted} numberOfLines={1} style={[styles.label, on && styles.labelOn]}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.full,
    backgroundColor: TRACK,
    ...tileShadowStyle,
  },
  track: {
    flexDirection: 'row',
    gap: INSET,
    padding: INSET,
    borderRadius: radius.full,
    backgroundColor: TRACK,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
  },
  // The picked tab's cream pill, lifted off the track
  pill: {
    position: 'absolute',
    left: INSET,
    top: INSET,
    bottom: INSET,
    borderRadius: radius.full,
    backgroundColor: botanical.cream,
    ...warmShadow.soft.style,
  },
  label: {
    fontSize: 15,
  },
  labelOn: {
    fontFamily: serif,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
