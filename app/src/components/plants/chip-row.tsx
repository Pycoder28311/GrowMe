import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { headerChips, type PlantPageData } from '@/config/plant-page';
import { botanical, mixColor, radius, smallCaps, space, tileGrain, tileTone, warmShadow } from '@/theme';

const softTint = (index: number) => mixColor(tileTone(index).background, botanical.cream, 0.5);

/** The small pills above the plant's name: family, genus, native area… (config/plant-page.ts HEADER_CHIPS) */
export function ChipRow({ plant }: { plant: PlantPageData }) {
  const chips = headerChips(plant);
  if (chips.length === 0) return null;
  return (
    <View style={styles.row}>
      {chips.map((chip, i) => (
        // A softer tint than the tiles' (halfway to cream), on an outer view with a subtle shadow (the pill clips its grain)
        <View key={chip.key} style={[styles.shadow, { backgroundColor: softTint(i) }]}>
          <View style={[styles.chip, { backgroundColor: softTint(i) }]}>
            <PaperGrain opacity={tileGrain} />
            <AppText color={botanical.inkMuted} numberOfLines={1} style={smallCaps}>
              {chip.text}
            </AppText>
          </View>
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
  shadow: {
    borderRadius: radius.full,
    ...warmShadow.soft.style,
  },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});
