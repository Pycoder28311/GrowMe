import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { EdgeDrift } from '@/components/layout/botanical-background';
import { ArrowButton } from '@/components/ui/arrow-button';
import { CurvedEdge, FlatFlower } from '@/components/ui/flower-shapes';
import { photoSource } from '@/lib/photo-source';
import { botanical, HEADER_FLOWERS, SQUARE_FLOWER_COLORS, size, space } from '@/theme';

/** Photo height: a little over a third of a phone screen */
export const PHOTO_HEIGHT = 280;
/** How tall the curved edge between the photos and the page is */
export const CURVE_HEIGHT = 46;
/** Where the thumbnails' centres sit: on the fade, near the photos' bottom (PhotoStack) */
export const THUMBS_CENTER = PHOTO_HEIGHT - 18;
/** The thumbnails' size (smaller when many have to fit in a row) */
export const THUMB_SIZE = 64;
/** Room under the photos for the thumbnails' lower half */
const UNDER = THUMB_SIZE / 2 - 18;
/** The whole header's height: the photos and the room under them (a page's content starts below) */
export const PHOTO_HEADER_HEIGHT = PHOTO_HEIGHT + UNDER;

/** How fast the photos move up while the page scrolls, as a share of the page's speed (0.5 = half) */
export const PHOTO_RISE = 0.5;
/** By this much scroll the photos have faded out completely */
export const PHOTO_GONE_AT = PHOTO_HEIGHT * 0.85;

type PhotoHeaderProps = {
  photos: string[];
  /** Read by screen readers, e.g. the plant's name */
  label: string;
  /** The page's scroll: the photos move up at half its speed, fading */
  scrollY: SharedValue<number>;
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * The plant's photos across the top, swipeable with ‹ ›, meeting the page in a curved cream line (the
 * thumbnails sit on that edge, drawn by PhotoStack over the page). Scrolling down
 * moves them up at half the page's speed (same size), so the page slides over them, fading out, until
 * the page's colour covers the screen.
 */
export function PhotoHeader({ photos, label, scrollY, index, onIndexChange }: PhotoHeaderProps) {
  const width = useWindowDimensions().width;
  const scrollRef = useRef<ScrollView>(null);

  const show = (next: number) => onIndexChange(Math.min(photos.length - 1, Math.max(0, next)));

  // Whoever changes the photo (the arrows, a thumbnail in the row), the strip slides to it
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  const pushedBack = useAnimatedStyle(() => {
    const y = Math.max(0, scrollY.get());
    return {
      opacity: interpolate(y, [0, PHOTO_GONE_AT], [1, 0], 'clamp'),
      // Held back by half the scroll, so on screen they rise at PHOTO_RISE of the page's speed; same size
      transform: [{ translateY: y * (1 - PHOTO_RISE) }],
    };
  });

  return (
    <View style={{ height: PHOTO_HEIGHT + UNDER }}>
      <Animated.View style={[styles.photos, pushedBack]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => onIndexChange(Math.round(event.nativeEvent.contentOffset.x / width))}>
          {photos.map((photo, i) => (
            <Image
              key={i}
              source={photoSource(photo)}
              contentFit="cover"
              accessibilityLabel={`${label}, φωτογραφία ${i + 1} από ${photos.length}`}
              style={{ width, height: PHOTO_HEIGHT }}
            />
          ))}
        </ScrollView>

        {/* A curved line where the photos meet the page (no fade) */}
        <CurvedEdge width={width} height={CURVE_HEIGHT} color={botanical.page} />
        {/* The page's painted flowers on the photos' lower corners: terracotta at the left, coral at the right */}
        {/* Each pushed further out past its edge near the top or bottom of the screen and turning as the page
            scrolls (the left one the other way), like the flower by the name */}
        <EdgeDrift scrollY={scrollY} side="left" size={HEADER_FLOWERS.left.size} turn={HEADER_FLOWERS.left.turn} style={styles.flowerLeft}>
          <FlatFlower kind="daisy" size={HEADER_FLOWERS.left.size} color={SQUARE_FLOWER_COLORS[0]} rotate={-14} opacity={0.9} style={styles.fill} />
        </EdgeDrift>
        <EdgeDrift scrollY={scrollY} side="right" size={HEADER_FLOWERS.right.size} turn={HEADER_FLOWERS.right.turn} style={styles.flowerRight}>
          <FlatFlower kind="flower" size={HEADER_FLOWERS.right.size} color={SQUARE_FLOWER_COLORS[1]} rotate={20} opacity={0.9} style={styles.fill} />
        </EdgeDrift>

        {photos.length > 1 && (
          <>
            <ArrowButton
              direction="previous"
              label="Προηγούμενη φωτογραφία"
              disabled={index === 0}
              onPress={() => show(index - 1)}
              style={[styles.arrow, { left: space.md }]}
            />
            <ArrowButton
              direction="next"
              label="Επόμενη φωτογραφία"
              disabled={index === photos.length - 1}
              onPress={() => show(index + 1)}
              style={[styles.arrow, { right: space.md }]}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  photos: {
    height: PHOTO_HEIGHT,
  },
  fill: {
    left: 0,
    top: 0,
  },
  flowerLeft: {
    left: -45,
    bottom: -55,
  },
  flowerRight: {
    right: -35,
    bottom: 0,
  },
  arrow: {
    position: 'absolute',
    top: PHOTO_HEIGHT / 2 - size.touch / 2,
  },
});
