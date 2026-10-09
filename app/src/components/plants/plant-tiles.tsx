import {
  PLANT_FLAGS,
  PLANT_KIND_LABELS,
  PLANT_SIZE_LABELS,
  WIND_LABELS,
  flagPhrase,
  type PlantSummary,
} from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { AppText } from '@/components/ui/app-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { FLAG_ICONS, KIND_ICONS, SIZE_ICON, WIND_ICON, type PlantIcon } from '@/config/plant-icons';
import { colors, radius, shadow, space } from '@/theme';

type Tile = { key: string; icon: PlantIcon; label: string };

/** A plant's characteristics as tiles: the dashboard's checkboxes that show something, then wind, kind and size */
export function plantTiles(plant: PlantSummary): Tile[] {
  const flags = PLANT_FLAGS.flatMap((flag) => {
    const label = flagPhrase(flag.key, plant[flag.key]);
    return label ? [{ key: flag.key, icon: FLAG_ICONS[flag.key], label }] : [];
  });
  return [
    ...flags,
    plant.wind && { key: 'wind', icon: WIND_ICON, label: WIND_LABELS[plant.wind] },
    plant.kind && { key: 'kind', icon: KIND_ICONS[plant.kind], label: PLANT_KIND_LABELS[plant.kind] },
    plant.size && { key: 'size', icon: SIZE_ICON, label: PLANT_SIZE_LABELS[plant.size] },
  ].filter((tile): tile is Tile => !!tile);
}

/** The characteristics as white tiles in two columns, each with its icon; a tap only shakes it */
export function PlantTiles({ plant }: { plant: PlantSummary }) {
  const tiles = plantTiles(plant);
  if (tiles.length === 0) return null;
  return (
    <View accessibilityRole="list" style={styles.grid}>
      {tiles.map((tile) => (
        <ShakeOnTap key={tile.key} style={styles.cell}>
          <View style={styles.tile}>
            <IconCircle icon={tile.icon} />
            <AppText size="small" color={colors.ink}>
              {tile.label}
            </AppText>
          </View>
        </ShakeOnTap>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  // Two per row
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  tile: {
    gap: space.xs,
    minHeight: 76,
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
});
