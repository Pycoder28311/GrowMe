import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { AppText } from '@/components/ui/app-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { alpha, colors, radius, shadow, space } from '@/theme';

/**
 * One info square of the plant page: the icon top left, `art` (an animation, a sun…) top right, then the
 * title and the plant's value in bold, and an optional small line. A tap only shakes it. `wide` takes a
 * whole row instead of the almost square shape.
 */
export function TileCard({
  icon,
  label,
  value,
  caption,
  art,
  wide = false,
  style,
}: {
  icon: PlantIcon;
  label: string;
  value: string;
  caption?: string;
  art?: ReactNode;
  wide?: boolean;
  style?: object;
}) {
  return (
    <ShakeOnTap style={style as never}>
      <View style={[styles.tile, !wide && styles.square]}>
        <View style={styles.top}>
          <IconCircle icon={icon} green />
          {art && <View style={styles.art}>{art}</View>}
        </View>
        <View style={styles.words}>
          <AppText color={colors.ink} style={styles.label}>
            {label}
          </AppText>
          <AppText bold color={colors.ink} style={styles.value}>
            {value}
          </AppText>
          {caption && (
            <AppText size="small" color={colors.inkMuted}>
              {caption}
            </AppText>
          )}
        </View>
      </View>
    </ShakeOnTap>
  );
}

const styles = StyleSheet.create({
  // The words right under the icon
  tile: {
    gap: space.xs,
    minHeight: 100,
    padding: space.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    // Stands out from the page: a deeper shadow, a faint edge, and a thicker darker one at the bottom
    borderWidth: 1,
    borderColor: alpha(colors.ink, 0.06),
    borderBottomWidth: 5,
    borderBottomColor: alpha(colors.ink, 0.14),
    boxShadow: shadow.raised,
  },
  // Wider than tall
  square: {
    aspectRatio: 1.45,
  },
  // The icon top left, the animation top right
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  words: {
    gap: 2,
    marginTop: -space.xs,
  },
  label: {
    fontSize: 16,
    lineHeight: 18,
  },
  value: {
    fontSize: 19,
    lineHeight: 22,
  },
  // Drawn bigger than the room it takes (a scale grows nothing around it): grown around its right edge's middle
  art: {
    flexDirection: 'row',
    transform: [{ scale: 1.3 }],
    transformOrigin: 'right center',
  },
});
