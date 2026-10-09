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
 * The plant's info as almost square white tiles in two columns: the icon top left, a small animation
 * top right (one per value: a tile with several takes a whole row), then the title and the plant's
 * value in bold. A tap only shakes it.
 * The animations run while `playing` (the tiles are on screen) and never with Reduce Motion.
 */
export function PlantTiles({ plant, playing }: { plant: PlantSummary; playing: boolean }) {
  const reduced = useReducedMotion();
  // Tiles with several animations take a whole row: first, so the half-width ones pair up below
  const all = infoTiles(plant);
  const tiles = [...all.filter((tile) => tile.arts.length > 1), ...all.filter((tile) => tile.arts.length <= 1)];
  if (tiles.length === 0) return null;
  return (
    <View accessibilityRole="list" style={styles.grid}>
      {tiles.map((tile) => (
        <ShakeOnTap key={tile.key} style={tile.arts.length > 1 ? styles.wide : styles.cell}>
          <View style={[styles.tile, tile.arts.length === 1 && styles.square]}>
            <View style={styles.top}>
              <IconCircle icon={tile.icon} />
              <View style={styles.arts}>
                {tile.arts.map((art, i) => (
                  <TileArtView key={i} art={art} playing={playing && !reduced} />
                ))}
              </View>
            </View>
            <View style={styles.words}>
              <AppText size="small" color={colors.inkMuted}>
                {tile.label}
              </AppText>
              <AppText bold color={colors.ink}>
                {tile.value}
              </AppText>
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
    justifyContent: 'space-between',
    rowGap: space.sm,
  },
  // Two per row; one left alone stays half wide
  cell: {
    width: '48.6%',
  },
  wide: {
    flexBasis: '100%',
  },
  tile: {
    justifyContent: 'space-between',
    gap: space.sm,
    minHeight: 128,
    padding: space.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  // Close to a square: a little wider than tall
  square: {
    aspectRatio: 1.15,
  },
  // The icon top left, the animation top right
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  // The title above, the plant's value in bold below it
  words: {
    gap: 2,
  },
  arts: {
    flexDirection: 'row',
  },
});
