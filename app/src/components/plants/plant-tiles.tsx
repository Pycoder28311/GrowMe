import type { PlantSummary } from '@growme/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SunSquare } from '@/components/plants/sun-square';
import { TileCard } from '@/components/plants/tile-card';
import { TILE_SHAPES } from '@/components/ui/flower-shapes';
import { sunSquareOf } from '@/config/plant-page';
import { infoTiles } from '@/config/plant-tiles';
import { SQUARE_TONE_ORDER, SQUARE_TONES, space } from '@/theme';

/** The colour of each of `count` squares, in the mockup's order */
const toneOrder = (count: number) => Array.from({ length: count }, (_, i) => SQUARE_TONE_ORDER[i % SQUARE_TONE_ORDER.length]);

/** The shape of the square at that place: each one different */
const shapeOf = (index: number) => TILE_SHAPES[index % TILE_SHAPES.length];

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
  const tones = toneOrder(tiles.length + (sun ? 1 : 0));
  return (
    <View accessibilityRole="list" style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {sun && <SunSquare plant={plant} style={StyleSheet.flatten(halfStyle)} tone={SQUARE_TONES[tones[0]]} shape={shapeOf(0)} playing={playing && !reduced} />}
      {tiles.map((tile, i) => (
        <TileCard
          key={tile.key}
          // Each square one of the colours, in the mockup's order, with its shape
          tone={SQUARE_TONES[tones[sun ? i + 1 : i]]}
          shape={shapeOf(sun ? i + 1 : i)}
          icon={tile.icon}
          label={tile.label}
          value={tile.value}
          style={StyleSheet.flatten(halfStyle)}
          playing={playing && !reduced}
          wiggleDelay={(sun ? i + 1 : i) * 450}
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
