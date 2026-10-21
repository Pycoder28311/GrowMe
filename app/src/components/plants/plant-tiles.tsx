import type { PlantSummary } from '@growme/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SunSquare } from '@/components/plants/sun-square';
import { TileArtView } from '@/components/plants/tile-art';
import { TileCard } from '@/components/plants/tile-card';
import { sunSquareOf } from '@/config/plant-page';
import { infoTiles } from '@/config/plant-tiles';
import { space } from '@/theme';

/** The same gap across and down between tiles */
const GAP = space.md + space.xs;

/**
 * The plant's info as almost square white tiles in two columns: the sunlight square first (exterior
 * plants), then difficulty, usage, time needed, toxicity and pot size (config/plant-tiles.ts). A tile with
 * several animations takes a whole row. The animations run while `playing` and never with Reduce Motion.
 */
export function PlantTiles({ plant, playing }: { plant: PlantSummary; playing: boolean }) {
  const reduced = useReducedMotion();
  // The grid's width: two half tiles and one GAP fill it exactly, so the gap is the same across and down
  const [width, setWidth] = useState(0);
  const half = width > 0 ? (width - GAP) / 2 : undefined;
  const halfStyle = [styles.cell, half !== undefined && { width: half }];
  // Tiles with several animations take a whole row: first, so the half-width ones pair up below
  const all = infoTiles(plant);
  const tiles = [...all.filter((tile) => tile.arts.length > 1), ...all.filter((tile) => tile.arts.length <= 1)];
  const sun = sunSquareOf(plant);
  if (tiles.length === 0 && !sun) return null;
  return (
    <View accessibilityRole="list" style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {sun && <SunSquare plant={plant} style={StyleSheet.flatten(halfStyle)} />}
      {tiles.map((tile) => (
        <TileCard
          key={tile.key}
          icon={tile.icon}
          label={tile.label}
          value={tile.value}
          wide={tile.arts.length > 1}
          style={tile.arts.length > 1 ? styles.wide : StyleSheet.flatten(halfStyle)}
          art={
            tile.arts.length > 0
              ? tile.arts.map((art, i) => <TileArtView key={i} art={art} playing={playing && !reduced} />)
              : undefined
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Full rows fill the width exactly, so centring only moves a half tile left alone in its row
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GAP,
  },
  // Two per row, one left alone stays half wide (centred): exactly half the grid less half the gap once
  // measured, this until then
  cell: {
    width: '46%',
  },
  wide: {
    flexBasis: '100%',
  },
});
