import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { dateRows, type PlantPageData } from '@/config/plant-page';
import { plantingPeriod } from '@/config/plant-traits';
import { colors, iconSize, space } from '@/theme';

/** One line per date range the plant has (seeding, planting, flowering, fruiting): «Σπορά: ΜΑΡ – ΑΠΡ, ΣΕΠ – ΟΚΤ» */
export function DateRows({ plant }: { plant: PlantPageData }) {
  const rows = dateRows(plant);
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <Icon name={row.icon.icon} size={iconSize.big} color={colors.ink} />
          <AppText style={styles.text}>
            <AppText color={colors.inkMuted} style={styles.text}>
              {row.label}:{' '}
            </AppText>
            <AppText bold style={styles.text}>
              {row.ranges.map((range) => plantingPeriod(range).label).join(', ')}
            </AppText>
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // A size up from the body text
  text: {
    fontSize: 18,
    lineHeight: 24,
  },
});
