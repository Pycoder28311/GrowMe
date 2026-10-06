import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BACKGROUND_PHOTOS, type BackgroundPhoto } from '@/config/background-photos';
import { useBackgroundBlur } from '@/lib/background-blur';
import { alpha, colors } from '@/theme';

const SLIDE_DURATION_MS = 6000;
const FADE_MS = 1500;
const ZOOM_MS = 7500;
// How soft the fully blurred copy is (px)
const BLUR_RADIUS = 12;

type SlideProps = {
  photo: BackgroundPhoto;
  active: boolean;
  /** The very first photo shows at once; later ones fade in over the previous one */
  initiallyVisible: boolean;
};

// Shown photo: fades in and zooms very slightly; the one before it fades out underneath.
// A permanently blurred copy sits on top and fades in with the page's scroll (useBackgroundBlur).
function Slide({ photo, active, initiallyVisible }: SlideProps) {
  const blur = useBackgroundBlur();
  const opacity = useSharedValue(initiallyVisible ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    opacity.set(withTiming(active ? 1 : 0, { duration: FADE_MS, easing: ease }));
    if (active) scale.set(withTiming(1.03, { duration: ZOOM_MS, easing: ease }));
  }, [active, opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  // Opacity only (no animated blur filter): cheap to change on every scroll frame
  const blurredStyle = useAnimatedStyle(() => ({ opacity: blur.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={photo.source}
        contentFit="cover"
        contentPosition={photo.position ?? 'center'}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, blurredStyle]}>
        <Image
          source={photo.source}
          contentFit="cover"
          contentPosition={photo.position ?? 'center'}
          blurRadius={BLUR_RADIUS}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Full-screen photos that cross-fade, with soft washes on top so text stays readable.
 * Only the shown photo and the one fading out are mounted, to keep memory low.
 */
export function BackgroundSlideshow() {
  const [slides, setSlides] = useState<{ active: number; previous: number | null }>({ active: 0, previous: null });

  useEffect(() => {
    const timer = setInterval(
      () => setSlides(({ active }) => ({ active: (active + 1) % BACKGROUND_PHOTOS.length, previous: active })),
      SLIDE_DURATION_MS,
    );
    return () => clearInterval(timer);
  }, []);

  // The previous photo underneath, the new one fading in on top
  const mounted = slides.previous === null ? [slides.active] : [slides.previous, slides.active];

  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.root}>
      {mounted.map((index) => (
        <Slide
          key={index}
          photo={BACKGROUND_PHOTOS[index]}
          active={index === slides.active}
          initiallyVisible={slides.previous === null}
        />
      ))}
      {/* Soft white wash plus a glow behind the title, text and buttons */}
      <View style={styles.wash} />
      <View style={styles.glow} />
      {/* Warm tint so photos with white walls never look plain white: strongest at the top */}
      <View style={styles.warm} />
    </View>
  );
}

/** Calm warm wash behind lists */
export function PlainBackground() {
  return <View pointerEvents="none" style={styles.plain} />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.surface, 0.15),
  },
  glow: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: `radial-gradient(${alpha(colors.surface, 0.1)}, ${alpha(colors.surface, 0.15)} 50%, transparent 80%)`,
  },
  warm: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: `linear-gradient(to bottom, ${alpha(colors.accent, 0.3)}, ${alpha(colors.accent, 0.1)} 50%)`,
  },
  plain: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: `linear-gradient(to bottom, ${alpha(colors.accent, 0.35)}, ${alpha(colors.accent, 0.08)} 40%, ${colors.surface})`,
  },
});
