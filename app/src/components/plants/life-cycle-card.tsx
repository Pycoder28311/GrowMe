import type { Lifecycle } from '@growme/shared';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { card } from '@/components/ui/styles';
import { colors, radius, space } from '@/theme';

/** The plant's life cycle stages (e.g. first flowers → 1 month), in their saved order, in a titled card */
export function LifeCycleCard({ stages }: { stages: Lifecycle[] }) {
  return (
    <View style={styles.card}>
      <AppText bold accessibilityRole="header">
        🌱 Κύκλος ζωής
      </AppText>
      <View style={styles.inner}>
        {stages.map((stage, index) => (
          <Fragment key={stage.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <AppText size="small" color={colors.inkMuted}>
                {stage.title}
              </AppText>
              <AppText size="small" bold color={colors.primary} style={styles.value}>
                {stage.content}
              </AppText>
            </View>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
  },
  inner: {
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
  },
  // Long texts wrap on the right instead of pushing the title out
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
  },
});
