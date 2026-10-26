import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BACKGROUND_PHOTOS, type BackgroundPhoto } from '@/config/background-photos';
import { useBackgroundBlur } from '@/lib/background-motion';
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
// A blurred copy sits on top and fades in with the page's scroll (useBackgroundBlur).
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
  // The blurred copy is there only while the page is scrolled: an invisible full-screen photo is still painted
  const [blurShown, setBlurShown] = useState(false);
  useAnimatedReaction(
    () => blur.value > 0,
    (shown, before) => {
      if (shown !== before) scheduleOnRN(setBlurShown, shown);
    },
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={photo.source}
        contentFit="cover"
        contentPosition={photo.position ?? 'center'}
        style={StyleSheet.absoluteFill}
      />
      {blurShown && (
        <Animated.View style={[StyleSheet.absoluteFill, blurredStyle]}>
          <Image
            source={photo.source}
            contentFit="cover"
            contentPosition={photo.position ?? 'center'}
            blurRadius={BLUR_RADIUS}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
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
      {/* One layer over the photos (each full-screen layer is costly to paint on phones): a warm cream tint (the
          botanical page's) so photos with white walls never look plain white, strongest at the top, over a soft
          white wash with a glow behind the title, text and buttons */}
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: colors.page,
  },
  // The first gradient is drawn on top. The second is the 15% white wash and the glow (10% → 15% at 50% → none at
  // 80%) in one: 1 − 0.85 × (1 − glow) at each stop, the wash alone past 80%
  overlay: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: [
      `linear-gradient(to bottom, ${alpha(colors.page, 0.5)}, ${alpha(colors.page, 0.15)} 50%)`,
      `radial-gradient(${alpha(colors.surface, 0.235)}, ${alpha(colors.surface, 0.2775)} 50%, ${alpha(colors.surface, 0.15)} 80%)`,
    ].join(', '),
  },
});
