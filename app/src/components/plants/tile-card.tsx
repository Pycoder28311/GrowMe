import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain, TileShape, type TileShapeKind } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { botanical, iconSize, mixColor, radius, serif, smallCaps, space, tileGrain, tileShadowStyle, type TileTone } from '@/theme';

/** The same height for every tile */
const TILE_HEIGHT = 140;
const TILE_RADIUS = radius.md;

/** Smaller letters for a longer value, so a list of choices fits the square */
const valueSize = (value: string) =>
  value.length > 28 ? { fontSize: 15, lineHeight: 18 } : value.length > 14 ? { fontSize: 18, lineHeight: 21 } : null;

/** The icon's little gif-like loop: a quick wiggle and a small pop, then a pause; still without `playing` or with Reduce Motion */
function WigglingIcon({ playing, delay, children }: { playing: boolean; delay: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!playing || reduced) {
      cancelAnimation(t);
      t.set(withTiming(0, { duration: 200 }));
      return;
    }
    const step = (to: number) => withTiming(to, { duration: 110, easing: Easing.inOut(Easing.sin) });
    t.set(withDelay(delay, withRepeat(withSequence(step(1), step(-1), step(0.7), step(-0.5), step(0), withTiming(0, { duration: 2200 })), -1)));
    return () => cancelAnimation(t);
  }, [playing, reduced, delay, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${t.get() * 14}deg` }, { scale: 1 + Math.abs(t.get()) * 0.12 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * One info square of the plant page, in the botanical look: a soft colour (`tone`) with a painted shape at its
 * right edge (`shape`), the icon in a circle top left (it wiggles a little every few seconds while `playing`,
 * `wiggleDelay` ms after the others), then a small uppercase title, the plant's value in a serif, and an optional
 * small line. A tap only shakes it. Every tile has the same height; a long value (several choices) wraps over up
 * to three lines and gets a smaller size.
 */
export function TileCard({
  icon,
  label,
  value,
  caption,
  playing = false,
  wiggleDelay = 0,
  tone,
  shape,
  style,
}: {
  icon: PlantIcon;
  label: string;
  value: string;
  caption?: string;
  playing?: boolean;
  wiggleDelay?: number;
  tone: TileTone;
  shape: TileShapeKind;
  style?: object;
}) {
  const ink = tone.light ? botanical.cream : botanical.ink;
  const muted = tone.light ? botanical.creamMuted : botanical.inkMuted;
  return (
    <ShakeOnTap style={style as never}>
      {/* The shadow sits on an outer view: the tile itself clips (its leaf), which would cut a shadow */}
      <View style={[styles.shadow, { backgroundColor: tone.background }]}>
        <View style={[styles.tile, { backgroundColor: tone.background }]}>
          <TileShape kind={shape} color={mixColor(tone.background, tone.shape, tone.light ? 0.8 : 0.9)} height={TILE_HEIGHT} />
          <PaperGrain opacity={tileGrain} />
          <View style={[styles.circle, { backgroundColor: tone.circle }]}>
            <WigglingIcon playing={playing} delay={wiggleDelay}>
              <Icon name={icon.icon} size={iconSize.big} color={tone.icon} />
            </WigglingIcon>
          </View>
          <View style={styles.words}>
            <AppText color={muted} style={smallCaps}>
              {label}
            </AppText>
            <AppText color={ink} numberOfLines={3} style={[styles.value, valueSize(value)]}>
              {value}
            </AppText>
            {caption && (
              <AppText size="small" color={muted}>
                {caption}
              </AppText>
            )}
          </View>
        </View>
      </View>
    </ShakeOnTap>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: TILE_RADIUS,
    ...tileShadowStyle,
  },
  tile: {
    height: TILE_HEIGHT,
    justifyContent: 'space-between',
    padding: space.md - 2,
    borderRadius: TILE_RADIUS,
    // The shape at the right edge is cut by the rounded corners
    overflow: 'hidden',
  },
  // The icon top left
  circle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    gap: 2,
  },
  // The value in the serif, like the mockup's «Moderate»
  value: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 26,
  },
});
