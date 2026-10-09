import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ArrowButton } from '@/components/ui/arrow-button';
import { Icon } from '@/components/ui/icon';
import type { PlantCardItem } from '@/lib/plants';
import { colors, iconSize, radius, shadow, size, space } from '@/theme';

const GAP = space.sm;
/** How much of a card the photo takes */
const PHOTO_RATIO = 0.62;

const openPlant = (id: number) => router.push({ pathname: '/plants/[id]', params: { id: String(id) } });

/** One plant in a carousel: photo, name, a line of text, «Δες περισσότερα» (the whole card opens it) */
function PlantSlide({ plant, width }: { plant: PlantCardItem; width: number }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${plant.name}: δες περισσότερα`}
      onPress={() => openPlant(plant.id)}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={[styles.photo, { height: width * PHOTO_RATIO }]}>
        {plant.image && <Image source={{ uri: plant.image }} contentFit="cover" style={StyleSheet.absoluteFill} />}
      </View>
      <View style={styles.words}>
        <AppText bold numberOfLines={1}>
          {plant.name}
        </AppText>
        <AppText size="small" color={colors.inkMuted} numberOfLines={2}>
          {plant.text}
        </AppText>
      </View>
      <View style={styles.more}>
        <AppText size="small" bold color={colors.primary}>
          Δες περισσότερα
        </AppText>
        <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
      </View>
    </Pressable>
  );
}

/**
 * Plant cards in a row that reaches the screen's right edge: one card and a third show at a time.
 * ‹ › (as on the photos) bring the previous / next card to the left edge; swiping snaps the same way.
 * Put it inside the page's side margin: it bleeds out to the screen's edges itself.
 */
export function PlantCarousel({ plants }: { plants: PlantCardItem[] }) {
  const screenWidth = useWindowDimensions().width;
  // card + gap + a third of a card = the screen minus the left margin
  const cardWidth = Math.round(((screenWidth - space.md - GAP) * 3) / 4);
  const step = cardWidth + GAP;
  const scroll = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = plants.length - 1;

  const show = (next: number) => {
    const target = Math.min(last, Math.max(0, next));
    scroll.current?.scrollTo({ x: target * step, animated: true });
    setIndex(target);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / step))}
        // The last card can reach the left edge too
        contentContainerStyle={[styles.row, { paddingRight: screenWidth - space.md - cardWidth }]}>
        {plants.map((plant) => (
          <PlantSlide key={plant.id} plant={plant} width={cardWidth} />
        ))}
      </ScrollView>

      {plants.length > 1 && (
        <>
          <ArrowButton
            direction="previous"
            label="Προηγούμενο φυτό"
            disabled={index === 0}
            onPress={() => show(index - 1)}
            style={[styles.arrow, { left: space.md + space.xs, top: (cardWidth * PHOTO_RATIO) / 2 }]}
          />
          <ArrowButton
            direction="next"
            label="Επόμενο φυτό"
            disabled={index >= last}
            onPress={() => show(index + 1)}
            style={[styles.arrow, { right: space.md, top: (cardWidth * PHOTO_RATIO) / 2 }]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, past the page's side margin
  root: {
    marginHorizontal: -space.md,
  },
  row: {
    gap: GAP,
    paddingLeft: space.md,
    paddingVertical: space.sm,
  },
  card: {
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  pressed: {
    opacity: 0.85,
  },
  photo: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: '#d4d4d8',
  },
  words: {
    gap: 2,
    minHeight: 54,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  arrow: {
    position: 'absolute',
    marginTop: -size.touch / 2 + space.sm,
  },
});
