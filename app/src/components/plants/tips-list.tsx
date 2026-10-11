import type { Tip } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LinkedText } from '@/components/ui/linked-text';
import { space } from '@/theme';

/**
 * The tips' look: light cream blocks, square, with a thick soft orange line on the left. Warm and light,
 * like the page that fades from white to peach under them.
 */
const TIP_BACKGROUND = '#fff6ea';
const TIP_LINE = '#f5b971';

/** A plant's tips, one block each */
export function TipsList({ tips }: { tips: Tip[] }) {
  return (
    <View accessibilityRole="list" style={styles.list}>
      {tips.map((tip) => (
        <View key={tip.id} style={styles.tip}>
          <AppText bold>{tip.title}</AppText>
          <LinkedText>{tip.content}</LinkedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.xs,
  },
  tip: {
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: TIP_BACKGROUND,
    borderLeftWidth: 4,
    borderLeftColor: TIP_LINE,
  },
});
