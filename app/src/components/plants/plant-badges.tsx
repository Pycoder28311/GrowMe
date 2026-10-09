import {
  PLANT_KIND_LABELS,
  PLANT_SIZE_LABELS,
  WIND_LABELS,
  visibleFlags,
  type PlantSummary,
} from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, space } from '@/theme';

type Badge = { key: string; emoji: string; label: string };

/** What a plant page shows under the scientific name: its yes/no characteristics, then wind, kind and size */
export function plantBadges(plant: PlantSummary): Badge[] {
  return [
    ...visibleFlags(plant),
    plant.wind && { key: 'wind', emoji: '🌬️', label: WIND_LABELS[plant.wind] },
    plant.kind && { key: 'kind', emoji: '🌸', label: PLANT_KIND_LABELS[plant.kind] },
    plant.size && { key: 'size', emoji: '📏', label: PLANT_SIZE_LABELS[plant.size] },
  ].filter((badge): badge is Badge => !!badge);
}

/** The plant's characteristics as soft green chips (nothing when it has none) */
export function PlantBadges({ plant }: { plant: PlantSummary }) {
  const badges = plantBadges(plant);
  if (badges.length === 0) return null;
  return (
    <View accessibilityRole="list" style={styles.chips}>
      {badges.map((badge) => (
        <View key={badge.key} accessibilityRole="text" style={styles.chip}>
          <AppText size="small" color={colors.primary}>
            {badge.emoji} {badge.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
});
