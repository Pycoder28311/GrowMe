import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { PHOTO_HEIGHT, THUMB_SIZE, THUMBS_CENTER } from '@/components/plants/photo-header';
import type { Rect } from '@/config/search-motion';
import { photoSource } from '@/lib/photo-source';
import { botanical, radius, shadow, size, space } from '@/theme';

/** At most this many thumbnails */
const MAX_THUMBS = 6;
const GAP = space.sm;
/**
 * Where each photo sits in the pile, from the first's place (px): the second is behind it, higher and a
 * little to the left, so its top edge shows above the first. (Only the first PILE_VISIBLE show.)
 */
const PILE_OFFSETS = [
  { x: 0, y: 0 },
  { x: -9, y: -2 },
];
const pileOffset = (i: number) => PILE_OFFSETS[i] ?? PILE_OFFSETS[PILE_OFFSETS.length - 1];
/** Each one's tilt in the pile, like Instagram's «Instants»: the top one almost straight */
const TILTS = [-3, -15, -7, 8, -9, 6];
/** Their size in the row under the photos, and in the pile at the top right (1 = the thumbnail size) */
const ROW_SCALE = 0.85;
const PILE_SCALE = 1.6;
/** Only this many show in the pile (the others fade away as they arrive); the photo view has them all */
const PILE_VISIBLE = 2;
/**
 * Past this scroll they fly to the pile (a whole flight, never stopping halfway with the scroll); back
 * above it, they fly back to the row. HYSTERESIS keeps them from flickering right at the line.
 */
const DOCK_AT = PHOTO_HEIGHT * 0.55;
const HYSTERESIS = 8;
const FLY_MS = 650;

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
  /** 0 in the row → 1 in the pile (the flight's progress) */
  docked: SharedValue<number>;
  rest: { x: number; y: number };
  stack: { x: number; y: number };
  size: number;
  /** Where the tap lands: in the row it picks the photo, in the pile it opens it */
  inPile: boolean;
  onPick: () => void;
  onOpen: (rect: Rect) => void;
};

function Thumb({ uri, i, count, active, scrollY, docked, rest, stack, size, inPile, onPick, onOpen }: ThumbProps) {
  const ref = useRef<View>(null);
  // One after the other: each starts a little later than the one before
  const lag = count > 1 ? Math.min(0.12, 0.5 / (count - 1)) : 0;

  const style = useAnimatedStyle(() => {
    const s = scrollY.get();
    const p = docked.get();
    const own = clamp01((p - i * lag) / (1 - (count - 1) * lag));
    const e = own * own * (3 - 2 * own); // ease in and out
    const restY = rest.y - s;
    return {
      // The photos beyond the pile's two melt away on the way
      opacity: i >= PILE_VISIBLE ? 1 - e : 1,
      transform: [
        { translateX: rest.x + (stack.x - rest.x) * e },
        { translateY: restY + (stack.y - restY) * e },
        { rotate: `${TILTS[i % TILTS.length] * e}deg` },
        // Smaller under the photos, bigger once piled up (about their centre)
        { scale: ROW_SCALE + (PILE_SCALE - ROW_SCALE) * e },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents={inPile && i >= PILE_VISIBLE ? 'none' : 'auto'}
      style={[styles.thumbPlace, { zIndex: count - i }, style]}>
      <Pressable
        ref={ref}
        accessibilityRole="imagebutton"
        accessibilityLabel={inPile ? `Φωτογραφία ${i + 1}, άνοιγμα` : `Φωτογραφία ${i + 1}`}
        accessibilityState={{ selected: active }}
        onPress={() =>
          inPile
            ? ref.current?.measureInWindow((left, top, width, height) => onOpen({ left, top, width, height }))
            : onPick()
        }
        style={[styles.thumb, { width: size, height: size }, (active || (inPile && i < PILE_VISIBLE)) && styles.thumbActive]}>
        <Image source={photoSource(uri)} contentFit="cover" style={StyleSheet.absoluteFill} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * The photos' thumbnails, over the page: first in a row centred on the photos' faded edge; once the
 * page scrolls past DOCK_AT they fly one by one to the top right under the search button and pile up
 * there, bigger and half off the screen's edge, one behind the other, tilted, so only the edges of
 * those behind show (only the first PILE_VISIBLE; the rest fade away). Scrolling back above it flies them back to the row. In the row a tap shows that
 * photo at the top (`onPick`); in the pile it opens it over the page (`onOpen`).
 */
export function PhotoStack({
  photos,
  index,
  scrollY,
  onPick,
  onOpen,
}: {
  photos: string[];
  index: number;
  scrollY: SharedValue<number>;
  onPick: (photo: number) => void;
  onOpen: (photo: number, rect: Rect) => void;
}) {
  const reduced = useReducedMotion();
  const docked = useSharedValue(0);
  const [inPile, setInPile] = useState(false);

  // Crossing the line starts the whole flight one way or the other
  useAnimatedReaction(
    () => {
      const s = scrollY.get();
      return s > DOCK_AT + HYSTERESIS ? 1 : s < DOCK_AT - HYSTERESIS ? 0 : -1;
    },
    (target, previous) => {
      if (target === -1 || target === previous) return;
      const going = target === 1;
      docked.set(reduced ? target : withTiming(target, { duration: FLY_MS, easing: Easing.inOut(Easing.cubic) }));
      scheduleOnRN(setInPile, going);
    },
  );
  const width = useWindowDimensions().width;
  const insets = useSafeAreaInsets();
  const thumbs = photos.slice(0, MAX_THUMBS);
  const count = thumbs.length;
  // As big as THUMB_SIZE, smaller when the row wouldn't fit
  const thumb = Math.min(THUMB_SIZE, (width - 2 * space.md - (count - 1) * GAP) / count);
  const rowWidth = count * thumb + (count - 1) * GAP;
  // Under the search button (top right corner), with the corners' gap. The pile is scaled about each
  // thumbnail's centre, so it moves down by the growth to keep its top there.
  const grow = ((PILE_SCALE - 1) * thumb) / 2;
  // (the second photo sits higher than the first: everything starts that much lower, to keep it clear of the button)
  const stackTop = insets.top + space.md + size.touch + space.sm + grow + Math.abs(Math.min(0, ...PILE_OFFSETS.map((o) => o.y)));

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
          docked={docked}
          size={thumb}
          inPile={inPile}
          onPick={() => onPick(i)}
          rest={{ x: (width - rowWidth) / 2 + i * (thumb + GAP), y: THUMBS_CENTER - thumb / 2 }}
          // The pile: right-aligned with the search button, each one just behind the one before
          // Centred on the screen's right edge, so half of it is off screen
          stack={{ x: width - thumb / 2 + pileOffset(i).x, y: stackTop + pileOffset(i).y }}
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
    borderColor: botanical.cream,
    backgroundColor: botanical.cream,
    boxShadow: shadow.card,
  },
  thumbActive: {
    borderColor: botanical.terracotta,
  },
});
