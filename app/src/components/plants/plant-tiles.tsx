import type { PlantSummary } from '@growme/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { IconCircle } from '@/components/plants/icon-circle';
import { TileArtView } from '@/components/plants/tile-art';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { infoTiles } from '@/config/plant-tiles';
import { seasonTrait } from '@/config/plant-traits';
import { alpha, colors, iconSize, radius, shadow, space } from '@/theme';

/** The same gap across and down between tiles */
const GAP = space.md + space.xs;

/**
 * The plant's info as almost square white tiles in two columns: the icon top left, a small animation
 * top right (one per value: a tile with several takes a whole row), then the title and the plant's
 * value in bold. A tap only shakes it.
 * The animations run while `playing` (the tiles are on screen) and never with Reduce Motion.
 */
export function PlantTiles({ plant, playing }: { plant: PlantSummary; playing: boolean }) {
  const reduced = useReducedMotion();
  // The grid's width: two half tiles and one GAP fill it exactly, so the gap is the same across and down
  const [width, setWidth] = useState(0);
  const half = width > 0 ? (width - GAP) / 2 : undefined;
  // Tiles with several animations take a whole row: first, so the half-width ones pair up below
  const all = infoTiles(plant);
  const tiles = [...all.filter((tile) => tile.arts.length > 1), ...all.filter((tile) => tile.arts.length <= 1)];
  if (tiles.length === 0) return null;
  return (
    <View accessibilityRole="list" style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {tiles.map((tile) => (
        <ShakeOnTap key={tile.key} style={tile.arts.length > 1 ? styles.wide : [styles.cell, half !== undefined && { width: half }]}>
          <View style={[styles.tile, tile.arts.length === 1 && styles.square]}>
            <View style={styles.top}>
              <IconCircle icon={tile.icon} green />
              <View style={styles.arts}>
                {tile.arts.map((art, i) => (
                  <TileArtView key={i} art={art} playing={playing && !reduced} />
                ))}
              </View>
            </View>
            <View style={styles.words}>
              <AppText color={colors.ink} style={styles.label}>
                {tile.label}
              </AppText>
              <AppText bold color={colors.ink} style={styles.value}>
                {tile.value}
              </AppText>
            </View>
          </View>
        </ShakeOnTap>
      ))}
    </View>
  );
}

/** The planting months as a plain line above the tiles: a calendar icon and «Φύτεμα: ΜΑΡ – ΜΑΪ, …» */
export function PlantingMonths({ plant }: { plant: PlantSummary }) {
  const season = seasonTrait(plant);
  if (!season) return null;
  return (
    <View style={styles.months}>
      <Icon name="calendar" size={iconSize.big} color={colors.ink} />
      <AppText style={styles.monthsText}>
        <AppText color={colors.inkMuted} style={styles.monthsText}>
          Φύτεμα:{' '}
        </AppText>
        <AppText bold style={styles.monthsText}>
          {season.label}
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  months: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // A size up from the body text
  monthsText: {
    fontSize: 18,
    lineHeight: 24,
  },
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
  // The words right under the icon
  tile: {
    gap: space.xs,
    minHeight: 100,
    padding: space.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    // Stands out from the page: a deeper shadow, a faint edge, and a thicker darker one at the bottom
    borderWidth: 1,
    borderColor: alpha(colors.ink, 0.06),
    borderBottomWidth: 5,
    borderBottomColor: alpha(colors.ink, 0.14),
    boxShadow: shadow.raised,
  },
  // Wider than tall
  square: {
    aspectRatio: 1.45,
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
    marginTop: -space.xs,
  },
  // A size up from before, with tight line heights so the tile keeps its height
  label: {
    fontSize: 16,
    lineHeight: 18,
  },
  value: {
    fontSize: 19,
    lineHeight: 22,
  },
  // Drawn bigger than the room it takes (a scale grows nothing around it): grown around its right edge's middle
  arts: {
    flexDirection: 'row',
    transform: [{ scale: 1.3 }],
    transformOrigin: 'right center',
  },
});
