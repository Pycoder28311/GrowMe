import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { BACKGROUND_PHOTOS, type BackgroundPhoto } from '@/config/background-photos';
import { alpha, colors } from '@/theme';

const SLIDE_DURATION_MS = 6000;
const FADE_MS = 1500;
const ZOOM_MS = 7500;

// Shown photo: fades in and zooms very slightly; hidden photo: fades out, then resets its zoom
function Slide({ photo, active }: { photo: BackgroundPhoto; active: boolean }) {
  const opacity = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    if (active) {
      opacity.set(withTiming(1, { duration: FADE_MS, easing: ease }));
      scale.set(withTiming(1.03, { duration: ZOOM_MS, easing: ease }));
    } else {
      opacity.set(withTiming(0, { duration: FADE_MS, easing: ease }));
      scale.set(withDelay(FADE_MS, withTiming(1, { duration: 0 })));
    }
  }, [active, opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={photo.source}
        contentFit="cover"
        contentPosition={photo.position ?? 'center'}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Full-screen photos that cross-fade, with soft washes on top so text stays readable */
export function BackgroundSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActiveIndex((index) => (index + 1) % BACKGROUND_PHOTOS.length),
      SLIDE_DURATION_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.root}>
      {BACKGROUND_PHOTOS.map((photo, index) => (
        <Slide key={index} photo={photo} active={index === activeIndex} />
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
