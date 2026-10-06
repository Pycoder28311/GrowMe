import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, space } from '@/theme';

const DOT = space.sm;

/** A list with a small round marker before each item */
export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.dot} />
          <AppText style={styles.text}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm,
  },
  item: {
    flexDirection: 'row',
    gap: space.sm,
  },
  // Lined up with the middle of the first text line
  dot: {
    width: DOT,
    height: DOT,
    marginTop: space.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  text: {
    flex: 1,
  },
});
