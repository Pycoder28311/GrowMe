import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain, TileShape, type TileShapeKind } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { botanical, iconSize, serif, smallCaps, space, type TileTone } from '@/theme';

/** The same height for every tile */
const TILE_HEIGHT = 140;
const TILE_RADIUS = 20;

/** Smaller letters for a longer value, so a list of choices fits the square */
const valueSize = (value: string) =>
  value.length > 28 ? { fontSize: 15, lineHeight: 18 } : value.length > 14 ? { fontSize: 18, lineHeight: 21 } : null;

/**
 * One info square of the plant page, in the botanical look: a soft colour (`tone`) with a flat shape at its
 * right edge (`shape`), the icon in a circle top left, `art` (an animation, a sun…) top right, then a small
 * uppercase title, the plant's value in a serif, and an optional small line. A tap only shakes it. Every tile
 * has the same height; a long value (several choices) wraps over up to three lines and gets a smaller size.
 */
export function TileCard({
  icon,
  label,
  value,
  caption,
  art,
  tone,
  shape,
  style,
}: {
  icon: PlantIcon;
  label: string;
  value: string;
  caption?: string;
  art?: ReactNode;
  tone: TileTone;
  shape: TileShapeKind;
  style?: object;
}) {
  const ink = tone.light ? botanical.cream : botanical.ink;
  const muted = tone.light ? 'rgba(251, 247, 241, 0.8)' : botanical.inkMuted;
  return (
    <ShakeOnTap style={style as never}>
      <View style={[styles.tile, { backgroundColor: tone.background }]}>
        <TileShape kind={shape} color={tone.shape} height={TILE_HEIGHT} />
        <PaperGrain />
        <View style={styles.top}>
          <View style={[styles.circle, { backgroundColor: tone.circle }]}>
            <Icon name={icon.icon} size={iconSize.big} color={tone.icon} />
          </View>
          {art && <View style={styles.art}>{art}</View>}
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
    </ShakeOnTap>
  );
}

const styles = StyleSheet.create({
  tile: {
    height: TILE_HEIGHT,
    justifyContent: 'space-between',
    padding: space.md - 2,
    borderRadius: TILE_RADIUS,
    // The shape at the right edge is cut by the rounded corners
    overflow: 'hidden',
  },
  // The icon top left, the animation top right
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    gap: 2,
  },
  // The value in the serif, like the mockup's «Moderate»
  value: {
    fontFamily: serif,
    fontSize: 22,
    lineHeight: 26,
  },
  // Drawn a little smaller, over the shape
  art: {
    flexDirection: 'row',
    transform: [{ scale: 0.95 }],
    transformOrigin: 'right top',
  },
});
