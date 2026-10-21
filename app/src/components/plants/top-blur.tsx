import { BlurView } from 'expo-blur';
import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { botanical } from '@/theme';

/** Over how much scroll it fades in, once the photos have passed under it */
const FADE_IN = 40;

/** Light blur layers, each shorter than the one before, so the blur is strongest at the top and fades out going down */
const LAYERS = [1, 0.8, 0.6, 0.4];
const LAYER_INTENSITY = 7;

/** The light wash's opacity from top to bottom: an eased fade to nothing */
const WASH = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return 0.5 * (1 - t * t * (3 - 2 * t));
});

/**
 * A soft blurred band behind the corner buttons and the section labels between them, so the labels
 * stand out from the page scrolling under them. The blur and the wash fade out towards the band's
 * lower edge, so it has no hard border with the page. It shows only once the photos have scrolled up
 * past it (`from`: the scroll at which their bottom reaches the band's lower edge), so they are never blurred.
 */
export function TopBlur({ scrollY, height, from }: { scrollY: SharedValue<number>; height: number; from: number }) {
  const washId = `top-wash-${useId().replace(/:/g, '')}`;
  const shown = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (scrollY.get() - from) / FADE_IN)),
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.band, { height }, shown]}>
      {LAYERS.map((share) => (
        <BlurView
          key={share}
          intensity={LAYER_INTENSITY}
          tint="light"
          style={[styles.layer, { height: height * share }]}
        />
      ))}
      {/* A light wash, so the labels read even where the blur is only a tint (Android); fading out downwards */}
      <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
            {WASH.map((opacity, i) => (
              <Stop key={i} offset={i / (WASH.length - 1)} stopColor={botanical.page} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={height} fill={`url(#${washId})`} />
      </Svg>
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
