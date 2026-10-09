import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/ui/icon';
import { raisedTile } from '@/components/ui/styles';
import type { Rect } from '@/config/search-motion';
import { alpha, colors, iconSize, radius, space } from '@/theme';

const SLIDE_MS = 380;
const timing = { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) };

export type LightboxPhoto = { uri: string; from: Rect };

/**
 * A photo opened from its thumbnail: it slides from the thumbnail to the middle of the screen, full
 * width, over the whole page blurred. A tap anywhere (or back) slides it back to its thumbnail.
 * (Android has no real blur here: a soft white veil instead.)
 */
export function PhotoLightbox({ photo, label, onClose }: { photo: LightboxPhoto; label: string; onClose: () => void }) {
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  /** The photo's height / width, once it has loaded (square until then) */
  const aspect = useSharedValue(1);
  const { from } = photo;

  useEffect(() => {
    progress.set(reduced ? withTiming(1, { duration: 150 }) : withTiming(1, timing));
  }, [progress, reduced]);

  const close = () => {
    progress.set(
      withTiming(0, reduced ? { duration: 150 } : timing, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
  };

  const maxWidth = screen.width - 2 * space.md;
  const maxHeight = screen.height * 0.72;

  const photoStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const height = Math.min(maxWidth * aspect.get(), maxHeight);
    const width = Math.min(maxWidth, height / aspect.get());
    const to = { left: (screen.width - width) / 2, top: (screen.height - height) / 2, width, height };
    if (reduced) return { ...to, opacity: p, borderRadius: radius.md };
    return {
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
      <Animated.View pointerEvents="box-none" style={[styles.photo, photoStyle]}>
        <Pressable accessibilityLabel={label} onPress={close} style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: photo.uri }}
            contentFit="cover"
            onLoad={(event) => {
              const { width, height } = event.source;
              if (width > 0 && height > 0) aspect.set(withTiming(height / width, { duration: 200 }));
            }}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
