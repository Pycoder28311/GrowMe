import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { raisedTile, tileIcon } from '@/components/ui/styles';
import { NAV_ITEMS, type NavId, type TapAnimation } from '@/config/app';
import { alpha, colors, iconSize, size, space } from '@/theme';

// Springy ease with a small overshoot, so the indicator settles like a drop of liquid
const SLIDE = { duration: 350, easing: Easing.bezier(0.34, 1.2, 0.64, 1) };

const TAP_TIMING: Record<TapAnimation, { duration: number; easing: ReturnType<typeof Easing.bezier> }> = {
  hop: { duration: 450, easing: Easing.bezier(0, 0, 0.58, 1) },
  wiggle: { duration: 450, easing: Easing.bezier(0.42, 0, 0.58, 1) },
  flap: { duration: 450, easing: Easing.bezier(0.42, 0, 0.58, 1) },
  spin: { duration: 600, easing: Easing.bezier(0.34, 1.3, 0.64, 1) },
};

// A tab icon that plays its own little animation once per tap
function NavIcon({ icon, active, animation, taps }: { icon: IconName; active: boolean; animation: TapAnimation; taps: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (taps === 0) return;
    progress.set(0);
    progress.set(withTiming(1, TAP_TIMING[animation]));
  }, [taps, animation, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    if (animation === 'hop') return { transform: [{ translateY: interpolate(p, [0, 0.35, 0.65, 0.82, 1], [0, -5, 0, -2, 0]) }] };
    if (animation === 'wiggle') return { transform: [{ rotate: `${interpolate(p, [0, 0.2, 0.45, 0.7, 1], [0, -12, 10, -5, 0])}deg` }] };
    if (animation === 'flap') return { transform: [{ scaleX: interpolate(p, [0, 0.35, 0.7, 1], [1, 0.55, 1.12, 1]) }] };
    return { transform: [{ rotate: `${p * 180}deg` }] };
  });

  return (
    <Animated.View style={[style, active ? tileIcon : styles.iconShadow]}>
      <Icon name={icon} size={iconSize.big} color={colors.ink} />
    </Animated.View>
  );
}

type BottomNavProps = {
  activeId: NavId;
  onNavigate: (id: NavId) => void;
};

/** The bottom bar: four icon tabs and a raised tile that slides to the active one */
export function BottomNav({ activeId, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const [positions, setPositions] = useState<Partial<Record<NavId, number>>>({});
  // The last tapped tab; `count` replays its icon animation on every tap
  const [tap, setTap] = useState<{ id: NavId | null; count: number }>({ id: null, count: 0 });
  const indicatorX = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  // No animation until the first tab change, so the indicator doesn't slide in on load
  const placed = useRef(false);

  const activeX = positions[activeId];

  useEffect(() => {
    if (activeX === undefined) return;
    if (!placed.current) {
      placed.current = true;
      indicatorX.set(activeX);
      return;
    }
    indicatorX.set(withTiming(activeX, SLIDE));
    // Wobbles like a drop of liquid while it travels
    const wobble = (a: number, b: number, c: number) =>
      withSequence(
        withTiming(a, { duration: 120 }),
        withTiming(b, { duration: 100 }),
        withTiming(c, { duration: 80 }),
        withTiming(1, { duration: 100 }),
      );
    squashX.set(wobble(1.25, 0.95, 1.02));
    squashY.set(wobble(0.86, 1.05, 0.98));
  }, [activeX, indicatorX, squashX, squashY]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }, { scaleX: squashX.value }, { scaleY: squashY.value }],
  }));

  const handleTap = (id: NavId) => {
    setTap((current) => ({ id, count: current.count + 1 }));
    onNavigate(id);
  };

  return (
    <View accessibilityRole="tabbar" style={[styles.nav, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {activeX !== undefined && (
          <Animated.View pointerEvents="none" style={[raisedTile, styles.indicator, indicatorStyle]} />
        )}

        {NAV_ITEMS.map(({ id, label, icon, tapAnimation }) => {
          const isActive = id === activeId;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              onPress={() => handleTap(id)}
              onLayout={(event) => {
                const x = event.nativeEvent.layout.x;
                setPositions((current) => (current[id] === x ? current : { ...current, [id]: x }));
              }}
              style={styles.item}>
              <NavIcon icon={icon} active={isActive} animation={tapAnimation} taps={tap.id === id ? tap.count : 0} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    borderTopWidth: 1,
    borderTopColor: alpha(colors.surface, 0.8),
    backgroundColor: alpha(colors.surface, 0.75),
    boxShadow: `inset 0 5px 10px ${alpha(colors.ink, 0.08)}, inset 0 -5px 10px ${alpha(colors.ink, 0.08)}`,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: space.xs,
  },
  indicator: {
    position: 'absolute',
    top: space.xs,
    left: 0,
    backgroundColor: alpha(colors.surface, 0.75),
  },
  item: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inactive icons get a soft drop shadow so they lift off the bar
  iconShadow: {
    filter: [{ dropShadow: { offsetX: 0, offsetY: 2, standardDeviation: 2, color: alpha(colors.ink, 0.25) } }],
  },
});
