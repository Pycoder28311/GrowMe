import { Image } from 'expo-image';
import { useId, useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ArrowButton } from '@/components/ui/arrow-button';
import { colors, size, space } from '@/theme';

/** Photo height: a little over a third of a phone screen */
export const PHOTO_HEIGHT = 280;
/** The white fade at the photos' bottom edge */
const FADE = 110;
/** Where the thumbnails' centres sit: on the fade, near the photos' bottom (PhotoStack) */
export const THUMBS_CENTER = PHOTO_HEIGHT - 18;
/** The thumbnails' size (smaller when many have to fit in a row) */
export const THUMB_SIZE = 64;
/** Room under the photos for the thumbnails' lower half */
const UNDER = THUMB_SIZE / 2 - 18;
/** The whole header's height: the photos and the room under them (a page's content starts below) */
export const PHOTO_HEADER_HEIGHT = PHOTO_HEIGHT + UNDER;

type PhotoHeaderProps = {
  photos: string[];
  /** Read by screen readers, e.g. the plant's name */
  label: string;
  /** The page's scroll: the photos are pushed back as it grows */
  scrollY: SharedValue<number>;
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * The plant's photos across the top, swipeable with ‹ ›, fading into the page through a white
 * gradient (the thumbnails sit on that edge, drawn by PhotoStack over the page). Scrolling down
 * pushes them back: smaller, slower than the page, fading out, so the page's colour covers the screen.
 */
export function PhotoHeader({ photos, label, scrollY, index, onIndexChange }: PhotoHeaderProps) {
  const width = useWindowDimensions().width;
  const scrollRef = useRef<ScrollView>(null);
  const fadeId = `fade-${useId().replace(/:/g, '')}`;

  const show = (next: number) => {
    const target = Math.min(photos.length - 1, Math.max(0, next));
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
    onIndexChange(target);
  };

  const pushedBack = useAnimatedStyle(() => {
    const y = Math.max(0, scrollY.get());
    return {
      opacity: interpolate(y, [0, PHOTO_HEIGHT * 0.85], [1, 0], 'clamp'),
      transform: [{ translateY: y * 0.45 }, { scale: interpolate(y, [0, PHOTO_HEIGHT], [1, 0.88], 'clamp') }],
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
              source={{ uri: photo }}
              contentFit="cover"
              accessibilityLabel={`${label}, φωτογραφία ${i + 1} από ${photos.length}`}
              style={{ width, height: PHOTO_HEIGHT }}
            />
          ))}
        </ScrollView>

        {/* The photos melt into the page */}
        <Svg pointerEvents="none" width={width} height={FADE} style={styles.fade}>
          <Defs>
            <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.surface} stopOpacity={0} />
              <Stop offset="0.7" stopColor={colors.surface} stopOpacity={0.85} />
              <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={FADE} fill={`url(#${fadeId})`} />
        </Svg>

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
  fade: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  arrow: {
    position: 'absolute',
    top: PHOTO_HEIGHT / 2 - size.touch / 2,
  },
});
