import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/ui/app-text';
import { ArrowButton } from '@/components/ui/arrow-button';
import { Icon } from '@/components/ui/icon';
import { raisedTile } from '@/components/ui/styles';
import type { Rect } from '@/config/search-motion';
import { photoSource } from '@/lib/photo-source';
import { alpha, colors, iconSize, radius, space } from '@/theme';

const SLIDE_MS = 380;
const timing = { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) };

/** Which photo opened, and where its thumbnail is (the photo grows from there and goes back there) */
export type LightboxPhoto = { index: number; from: Rect };

/** A drag this far (or a flick this fast, px/s) moves to the next or previous photo */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;
/** Past the first or last photo, a drag only gives way this much */
const EDGE_GIVE = 0.3;
const CHANGE_MS = 260;

/**
 * A photo opened from its thumbnail: it slides from the thumbnail to the middle of the screen, full
 * width, over the whole page blurred. ‹ › (or a drag left and right, with a finger or the mouse) go
 * through the plant's photos; a tap anywhere (or back) slides it back to its thumbnail.
 * (Android has no real blur here: a soft white veil instead.)
 */
export function PhotoLightbox({
  photos,
  photo,
  label,
  onClose,
}: {
  photos: string[];
  photo: LightboxPhoto;
  label: string;
  onClose: () => void;
}) {
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  /** The photo's height / width, once it has loaded (square until then) */
  const aspect = useSharedValue(1);
  const { from } = photo;
  const [index, setIndex] = useState(photo.index);
  /** The photo's sideways offset: while dragged, and while one slides out and the next in */
  const slide = useSharedValue(0);
  const last = photos.length - 1;

  // The same index for the drag handlers, which must not read React state (they live outside render)
  const shown = useSharedValue(photo.index);

  /** To the next (+1) or previous (-1) photo: this one slides out that way, the new one slides in */
  const go = useCallback(
    (direction: 1 | -1) => {
      const next = shown.get() + direction;
      if (next < 0 || next > last) {
        slide.set(withTiming(0, { duration: CHANGE_MS }));
        return;
      }
      shown.set(next);
      const out = -direction * screen.width;
      const swap = () => {
        setIndex(next);
        aspect.set(1);
      };
      if (reduced) {
        swap();
        slide.set(0);
        return;
      }
      slide.set(
        withTiming(out, { duration: CHANGE_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (!finished) return;
          scheduleOnRN(swap);
          slide.set(-out);
          slide.set(withTiming(0, { duration: CHANGE_MS, easing: Easing.out(Easing.cubic) }));
        }),
      );
    },
    [aspect, last, reduced, screen.width, shown, slide],
  );

  const close = useCallback(() => {
    progress.set(
      withTiming(0, reduced ? { duration: 150 } : timing, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
  }, [onClose, progress, reduced]);

  // On the photo (finger or mouse): a sideways drag moves it with the pointer and, let go far or fast
  // enough, changes it; a tap closes it. The drag wins when both could apply.
  const drag = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      const at = shown.get();
      const beyond = (event.translationX > 0 && at === 0) || (event.translationX < 0 && at === last);
      slide.set(beyond ? event.translationX * EDGE_GIVE : event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_DISTANCE || event.velocityX < -SWIPE_VELOCITY) scheduleOnRN(go, 1);
      else if (event.translationX > SWIPE_DISTANCE || event.velocityX > SWIPE_VELOCITY) scheduleOnRN(go, -1);
      else slide.set(withTiming(0, { duration: CHANGE_MS }));
    });
  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) scheduleOnRN(close);
  });
  const gesture = Gesture.Exclusive(drag, tap);

  useEffect(() => {
    progress.set(reduced ? withTiming(1, { duration: 150 }) : withTiming(1, timing));
  }, [progress, reduced]);

  const maxWidth = screen.width - 2 * space.md;
  const maxHeight = screen.height * 0.72;

  const photoStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const height = Math.min(maxWidth * aspect.get(), maxHeight);
    const width = Math.min(maxWidth, height / aspect.get());
    const to = { left: (screen.width - width) / 2, top: (screen.height - height) / 2, width, height };
    if (reduced) return { ...to, opacity: p, borderRadius: radius.md, transform: [{ translateX: slide.get() }] };
    return {
      transform: [{ translateX: slide.get() }],
      left: from.left + (to.left - from.left) * p,
      top: from.top + (to.top - from.top) * p,
      width: from.width + (to.width - from.width) * p,
      height: from.height + (to.height - from.height) * p,
      borderRadius: radius.sm + (radius.md - radius.sm) * p,
    };
  });
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}>
      {/* A modal is outside the app's gesture root: it needs its own */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFill} />
          <Pressable accessibilityRole="button" accessibilityLabel="Κλείσιμο" onPress={close} style={styles.veil} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Κλείσιμο"
            onPress={close}
            style={[styles.close, { top: insets.top + space.md }]}>
            <Icon name="close" size={iconSize.big} color={colors.ink} bold />
          </Pressable>
        </Animated.View>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.photo, photoStyle]}>
            {/* Taps and swipes come from the gesture; screen readers close it with "activate" */}
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${label}, φωτογραφία ${index + 1} από ${photos.length}`}
              accessibilityHint="Κλείσιμο"
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={close}
              style={StyleSheet.absoluteFill}>
              <Image
                key={index}
                source={photoSource(photos[index])}
                contentFit="cover"
                onLoad={(event) => {
                  const { width, height } = event.source;
                  if (width > 0 && height > 0) aspect.set(withTiming(height / width, { duration: 200 }));
                }}
                // The pointer goes to the box around it: a browser would otherwise start dragging the image
                // itself (and swallow the swipe)
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Through the photos: ‹ › on the sides and which one this is, under it */}
        {photos.length > 1 && (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, backdrop]}>
            <ArrowButton
              direction="previous"
              label="Προηγούμενη φωτογραφία"
              disabled={index === 0}
              onPress={() => go(-1)}
              style={[styles.arrow, { left: space.sm, top: screen.height / 2 - ARROW / 2 }]}
            />
            <ArrowButton
              direction="next"
              label="Επόμενη φωτογραφία"
              disabled={index === last}
              onPress={() => go(1)}
              style={[styles.arrow, { right: space.sm, top: screen.height / 2 - ARROW / 2 }]}
            />
            <View pointerEvents="none" style={[styles.counter, { bottom: insets.bottom + space.lg + COUNTER_LIFT }]}>
              <AppText size="small" bold>
                {index + 1} / {photos.length}
              </AppText>
            </View>
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

/** The counter sits above where the page's bottom bar is, so it never covers its icons */
const COUNTER_LIFT = 64;
/** The arrow buttons' size (ArrowButton is a touch-sized circle) */
const ARROW = 48;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  arrow: {
    position: 'absolute',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.9),
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.ink, 0.12),
  },
  close: {
    ...raisedTile,
    position: 'absolute',
    right: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.surface, 0.9),
  },
  photo: {
    position: 'absolute',
    overflow: 'hidden',
    boxShadow: `0 12px 40px ${alpha(colors.ink, 0.3)}`,
  },
});
