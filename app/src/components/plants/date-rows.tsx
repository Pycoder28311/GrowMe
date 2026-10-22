import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { dateRows, type PlantPageData } from '@/config/plant-page';
import { plantingPeriod } from '@/config/plant-traits';
import { botanical, iconSize, radius, smallCaps, space } from '@/theme';

/** One line per date range the plant has (seeding, planting, flowering, fruiting): «Σπορά: ΜΑΡ – ΑΠΡ, ΣΕΠ – ΟΚΤ» */
export function DateRows({ plant }: { plant: PlantPageData }) {
  const rows = dateRows(plant);
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.circle}>
            <Icon name={row.icon.icon} size={iconSize.normal} color={botanical.cream} />
          </View>
          <AppText style={styles.text}>
            <AppText color={botanical.inkMuted} style={[styles.text, smallCaps, styles.label]}>
              {row.label}:{' '}
            </AppText>
            <AppText bold color={botanical.ink} style={styles.text}>
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
    gap: space.sm,
  },
  // The mockup's olive circle with a cream calendar
  circle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: botanical.olive,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // «ΦΥΤΕΜΑ:» in the small caps, but closer to the dates' size
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
  text: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.4,
  },
});
