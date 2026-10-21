import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { headerChips, type PlantPageData } from '@/config/plant-page';
import { botanical, radius, smallCaps, space } from '@/theme';

/** The small pills above the plant's name: family, genus, native area… (config/plant-page.ts HEADER_CHIPS) */
export function ChipRow({ plant }: { plant: PlantPageData }) {
  const chips = headerChips(plant);
  if (chips.length === 0) return null;
  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <View key={chip.key} style={styles.chip}>
          <AppText color={botanical.inkMuted} numberOfLines={1} style={smallCaps}>
            {chip.text}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs + 2,
  },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: botanical.sand,
  },
});
