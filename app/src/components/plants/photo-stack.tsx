import { Image } from 'expo-image';
import { useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PHOTO_HEIGHT, THUMB_SIZE, THUMBS_CENTER } from '@/components/plants/photo-header';
import type { Rect } from '@/config/search-motion';
import { colors, radius, shadow, size, space } from '@/theme';

/** At most this many thumbnails */
const MAX_THUMBS = 6;
const GAP = space.sm;
/** In the pile, each photo behind sits this much lower and to the left: only its edges show */
const PILE_STEP = { x: -1.5, y: 2.5 };
/** Each one's tilt in the pile, like Instagram's «Instants»: the top one almost straight */
const TILTS = [-3, 5, -7, 8, -9, 6];
/** The scroll over which they fly from the photos' edge to the stack */
const FLY_FROM = PHOTO_HEIGHT * 0.3;
const FLY_TO = PHOTO_HEIGHT * 0.9;

const clamp01 = (value: number) => {
  'worklet';
  return Math.min(1, Math.max(0, value));
};

type ThumbProps = {
  uri: string;
  i: number;
  count: number;
  active: boolean;
  scrollY: SharedValue<number>;
  rest: { x: number; y: number };
  stack: { x: number; y: number };
  size: number;
  onOpen: (rect: Rect) => void;
};

function Thumb({ uri, i, count, active, scrollY, rest, stack, size, onOpen }: ThumbProps) {
  const ref = useRef<View>(null);
  // One after the other: each starts a little later than the one before
  const lag = count > 1 ? Math.min(0.12, 0.5 / (count - 1)) : 0;

  const style = useAnimatedStyle(() => {
    const s = scrollY.get();
    const p = clamp01((s - FLY_FROM) / (FLY_TO - FLY_FROM));
    const own = clamp01((p - i * lag) / (1 - (count - 1) * lag));
    const e = own * own * (3 - 2 * own); // ease in and out
    const restY = rest.y - s;
    return {
      transform: [
        { translateX: rest.x + (stack.x - rest.x) * e },
        { translateY: restY + (stack.y - restY) * e },
        { rotate: `${TILTS[i % TILTS.length] * e}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.thumbPlace, { zIndex: count - i }, style]}>
      <Pressable
        ref={ref}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Φωτογραφία ${i + 1}, άνοιγμα`}
        onPress={() => ref.current?.measureInWindow((left, top, width, height) => onOpen({ left, top, width, height }))}
        style={[styles.thumb, { width: size, height: size }, active && styles.thumbActive]}>
        <Image source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * The photos' thumbnails, over the page: first in a row centred on the photos' faded edge, then, as
 * the page scrolls, they fly one by one to the top right under the search button and pile up there
 * one behind the other, tilted, so only the edges of those behind show. A tap opens that photo.
 */
export function PhotoStack({
  photos,
  index,
  scrollY,
  onOpen,
}: {
  photos: string[];
  index: number;
  scrollY: SharedValue<number>;
  onOpen: (photo: number, rect: Rect) => void;
}) {
  const width = useWindowDimensions().width;
  const insets = useSafeAreaInsets();
  const thumbs = photos.slice(0, MAX_THUMBS);
  const count = thumbs.length;
  // As big as THUMB_SIZE, smaller when the row wouldn't fit
  const thumb = Math.min(THUMB_SIZE, (width - 2 * space.md - (count - 1) * GAP) / count);
  const rowWidth = count * thumb + (count - 1) * GAP;
  // Under the search button (top right corner), with the corners' gap
  const stackTop = insets.top + space.md + size.touch + space.sm;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {thumbs.map((uri, i) => (
        <Thumb
          key={i}
          uri={uri}
          i={i}
          count={count}
          active={i === index}
          scrollY={scrollY}
          size={thumb}
          rest={{ x: (width - rowWidth) / 2 + i * (thumb + GAP), y: THUMBS_CENTER - thumb / 2 }}
          // The pile: right-aligned with the search button, each one just behind the one before
          stack={{ x: width - space.md - thumb + i * PILE_STEP.x, y: stackTop + i * PILE_STEP.y }}
          onOpen={(rect) => onOpen(i, rect)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thumbPlace: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  thumbActive: {
    borderColor: colors.primary,
  },
});
