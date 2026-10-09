import type { Tip } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LinkedText } from '@/components/ui/linked-text';
import { space } from '@/theme';

/** The tips' look: light gray blocks, square, with a thick yellow-orange line below */
const TIP_BACKGROUND = '#f3f4f6';
const TIP_LINE = '#f5a524';

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
    borderBottomWidth: 4,
    borderBottomColor: TIP_LINE,
  },
});
