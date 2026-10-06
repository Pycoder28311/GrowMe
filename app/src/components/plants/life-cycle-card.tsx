import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { card } from '@/components/ui/styles';
import type { PlantDetails } from '@/config/plant-details';
import { colors, radius, space } from '@/theme';

/** The plant's milestones (first flowers, full bloom, lifespan) in a titled card */
export function LifeCycleCard({ milestones }: { milestones: PlantDetails['lifecycle'] }) {
  return (
    <View style={styles.card}>
      <AppText bold accessibilityRole="header">
        🌱 Κύκλος ζωής
      </AppText>
      <View style={styles.inner}>
        {milestones.map((milestone, index) => (
          <Fragment key={milestone.label}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <AppText size="small" color={colors.inkMuted}>
                {milestone.label}
              </AppText>
              <AppText size="small" bold color={colors.primary}>
                {milestone.value}
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
  divider: {
    height: 1,
    backgroundColor: colors.surface,
  },
});
