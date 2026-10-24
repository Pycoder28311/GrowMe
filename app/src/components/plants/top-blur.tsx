import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

/** Over how much scroll it fades in, once the photos have passed under it */
const FADE_IN = 40;

/** Light blur layers, each a little shorter than the one before, so the blur is strongest at the top and fades out going down in many fine steps (no visible edge) */
const LAYERS = Array.from({ length: 14 }, (_, i) => 1 - i / 14);
const LAYER_INTENSITY = 4;

/**
 * On the web the blur is one plain CSS backdrop blur with a mask fading it out downwards. (expo-blur's web version adds
 * `saturate(180%)` to every layer, and many layers stacked turn the cream page strongly yellow.)
 */
const WEB_BLUR = {
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  maskImage: 'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 0.6) 45%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 0.6) 45%, transparent 100%)',
} as const;

/**
 * A soft blurred band behind the corner buttons and the section labels between them, so the labels
 * stand out from the page scrolling under them. No colour, only blur, fading out towards the band's
 * lower edge, so it has no hard border with the page. It shows only once the photos have scrolled up
 * past it (`from`: the scroll at which their bottom reaches the band's lower edge), so they are never blurred.
 */
export function TopBlur({ scrollY, height, from }: { scrollY: SharedValue<number>; height: number; from: number }) {
  const shown = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (scrollY.get() - from) / FADE_IN)),
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.band, { height }, shown]}>
      {Platform.OS === 'web' ? (
        <Animated.View style={[styles.layer, { height }, WEB_BLUR as never]} />
      ) : (
        LAYERS.map((share) => (
          <BlurView key={share} intensity={LAYER_INTENSITY} tint="default" style={[styles.layer, { height: height * share }]} />
        ))
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
