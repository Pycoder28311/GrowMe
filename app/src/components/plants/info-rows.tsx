import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LongLeafShape, PaperGrain } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { botanical, iconSize, serif, smallCaps, space, type TileTone } from '@/theme';

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

/** Three dots, `filled` of them in the accent colour: how much the plant takes */
function LevelDots({ filled, color }: { filled: number; color: string }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i < filled ? { backgroundColor: color } : { borderColor: color, borderWidth: 1.5 }]} />
      ))}
    </View>
  );
}

/**
 * One row per thing the plant tolerates (frost, sea salt, wind), in the tiles' style: a warm tint with paper
 * grain and a painted leaf at the right edge, the icon in its accent circle, a small uppercase title over a
 * serif sentence, and how much as dots. A tap only shakes it.
 */
export function InfoRows({ rows }: { rows: readonly InfoRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <ShakeOnTap key={row.key}>
          <View
            accessible
            accessibilityLabel={`${row.title}: ${row.text} (${row.levelLabel})`}
            style={[styles.row, { backgroundColor: row.tone.background }]}>
            <LongLeafShape size={ROW_HEIGHT * 1.7} color={row.tone.shape} rotate={-62} opacity={0.9} style={styles.leaf} />
            <PaperGrain />
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
            <LevelDots filled={row.dots} color={botanical.ink} />
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
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
    paddingHorizontal: space.md - 4,
    borderRadius: 20,
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
    borderRadius: 21,
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
  // On a small cream pill so they read over the leaf
  dots: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs + 2,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 247, 241, 0.85)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
