import type { PlantSummary } from '@growme/shared';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { IconCircle } from '@/components/plants/icon-circle';
import { TileArtView } from '@/components/plants/tile-art';
import { AppText } from '@/components/ui/app-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { infoTiles } from '@/config/plant-tiles';
import { colors, radius, shadow, space } from '@/theme';

/**
 * The plant's info as white tiles in two columns: the icon top-left, the words under it, and a small
 * animation on the right (one per value: a tile with several takes a whole row). A tap only shakes it.
 * The animations run while `playing` (the tiles are on screen) and never with Reduce Motion.
 */
export function PlantTiles({ plant, playing }: { plant: PlantSummary; playing: boolean }) {
  const reduced = useReducedMotion();
  const tiles = infoTiles(plant);
  if (tiles.length === 0) return null;
  return (
    <View accessibilityRole="list" style={styles.grid}>
      {tiles.map((tile) => (
        <ShakeOnTap key={tile.key} style={tile.arts.length > 1 ? styles.wide : styles.cell}>
          <View style={styles.tile}>
            <View style={styles.words}>
              <IconCircle icon={tile.icon} />
              <AppText size="small" color={colors.ink}>
                {tile.label}
              </AppText>
            </View>
            <View style={styles.arts}>
              {tile.arts.map((art, i) => (
                <TileArtView key={i} art={art} playing={playing && !reduced} />
              ))}
            </View>
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
  wide: {
    flexBasis: '100%',
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: 84,
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  words: {
    flex: 1,
    alignSelf: 'stretch',
    gap: space.xs,
  },
  arts: {
    flexDirection: 'row',
  },
});
