import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LongLeafOutlineShape, PaperGrain } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { botanical, iconSize, radius, serif, smallCaps, space, tileGrain, tileShadowStyle, type TileTone } from '@/theme';

export type InfoRow = {
  key: string;
  icon: PlantIcon;
  /** A small uppercase title («Παγετός») */
  title: string;
  /** The sentence («Αντέχει ελαφρύ παγετό») */
  text: string;
  /** How much, as filled dots out of three, and in words for screen readers */
  dots: number;
  levelLabel: string;
  tone: TileTone;
};

const ROW_HEIGHT = 68;

/**
 * One row per thing the plant tolerates (frost, sea salt, wind), in the tiles' style: a warm tint with paper
 * grain and a faint outlined leaf at the right edge (a thin green inner shadow along its outline), the icon in its accent circle, a small uppercase title over a
 * serif sentence. A tap only shakes it.
 */
export function InfoRows({ rows }: { rows: readonly InfoRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <ShakeOnTap key={row.key}>
          {/* The squares' shadow, on an outer view: the row itself clips its leaf */}
          <View style={[styles.shadow, { backgroundColor: row.tone.background }]}>
            <View
              accessible
              accessibilityLabel={`${row.title}: ${row.text} (${row.levelLabel})`}
              style={[styles.row, { backgroundColor: row.tone.background }]}>
              <LongLeafOutlineShape size={ROW_HEIGHT * 1.7} color={row.tone.shape} glow={botanical.leaf} glowSpread={0.22} rotate={-62} opacity={0.35} style={styles.leaf} />
              <PaperGrain opacity={tileGrain} />
              <View style={[styles.circle, { backgroundColor: row.tone.circle }]}>
                <Icon name={row.icon.icon} size={iconSize.normal} color={row.tone.icon} />
              </View>
              <View style={styles.words}>
                <AppText color={botanical.inkMuted} style={smallCaps}>
                  {row.title}
                </AppText>
                <AppText color={botanical.ink} numberOfLines={1} style={styles.text}>
                  {row.text}
                </AppText>
              </View>
            </View>
          </View>
        </ShakeOnTap>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm + space.xs,
  },
  shadow: {
    borderRadius: radius.md,
    ...tileShadowStyle,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
    paddingHorizontal: space.md - 4,
    borderRadius: radius.md,
    // The leaf at the right edge is cut by the rounded corners
    overflow: 'hidden',
  },
  leaf: {
    right: -ROW_HEIGHT * 0.55,
    top: -ROW_HEIGHT * 0.35,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    flex: 1,
    gap: 1,
  },
  // The sentence in the serif, like the tiles' values
  text: {
    fontFamily: serif,
    fontSize: 18,
    lineHeight: 22,
  },
});
