import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

const SWING = 4;
const SWING_MS = 50;

/**
 * Something that only shows information: a tap gives it a short shake, so the user sees it isn't a
 * button (with Reduce Motion, a quick dim instead). Screen readers read it as plain text.
 */
export function ShakeOnTap({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const opacity = useSharedValue(1);
  const moving = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: x.value }] }));

  const shake = () => {
    if (reduced) {
      opacity.set(withSequence(withTiming(0.6, { duration: 80 }), withTiming(1, { duration: 160 })));
      return;
    }
    x.set(
      withSequence(
        withTiming(-SWING, { duration: SWING_MS }),
        withTiming(SWING, { duration: SWING_MS }),
        withTiming(-SWING, { duration: SWING_MS }),
        withTiming(SWING / 2, { duration: SWING_MS }),
        withTiming(0, { duration: SWING_MS }),
      ),
    );
  };

  return (
    <Pressable onPress={shake} accessibilityRole="text" style={style}>
      <Animated.View style={moving}>{children}</Animated.View>
    </Pressable>
  );
}
