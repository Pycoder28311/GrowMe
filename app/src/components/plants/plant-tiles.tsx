import type { PlantSummary } from '@growme/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SunSquare } from '@/components/plants/sun-square';
import { TileArtView } from '@/components/plants/tile-art';
import { TileCard } from '@/components/plants/tile-card';
import { TILE_SHAPES } from '@/components/ui/flower-shapes';
import { sunSquareOf } from '@/config/plant-page';
import { infoTiles } from '@/config/plant-tiles';
import { space, tileTone } from '@/theme';

/** The same gap across and down between tiles */
const GAP = space.sm + space.xs;

/**
 * The plant's info as almost square white tiles in two columns: the sunlight square first (exterior
 * plants), then difficulty, usage, time needed, toxicity and pot size (config/plant-tiles.ts). All the same size,
 * two to a row, each with one animation (a long list of values wraps and shrinks to fit). The animations run while `playing` and never with Reduce Motion.
 */
export function PlantTiles({ plant, playing }: { plant: PlantSummary; playing: boolean }) {
  const reduced = useReducedMotion();
  // The grid's width: two half tiles and one GAP fill it exactly, so the gap is the same across and down
  const [width, setWidth] = useState(0);
  const half = width > 0 ? (width - GAP) / 2 : undefined;
  const halfStyle = [styles.cell, half !== undefined && { width: half }];
  const tiles = infoTiles(plant);
  const sun = sunSquareOf(plant);
  if (tiles.length === 0 && !sun) return null;
  return (
    <View accessibilityRole="list" style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {sun && <SunSquare plant={plant} style={StyleSheet.flatten(halfStyle)} tone={tileTone(2)} shape="blob" />}
      {tiles.map((tile, i) => (
        <TileCard
          key={tile.key}
          // Each tile its own colour and shape, in turn (the sun square takes the butter one)
          tone={tileTone(sun ? (i >= 2 ? i + 1 : i) : i)}
          shape={TILE_SHAPES[i % TILE_SHAPES.length]}
          icon={tile.icon}
          label={tile.label}
          value={tile.value}
          style={StyleSheet.flatten(halfStyle)}
          art={tile.art ? <TileArtView art={tile.art} playing={playing && !reduced} /> : undefined}
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
});
