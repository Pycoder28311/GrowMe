import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Size while pressed, e.g. 0.95: the element pushes back slightly */
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

/** A Pressable that shrinks a little while pressed, like the Plant demo's buttons */
export function PressableScale({ pressedScale = 0.95, style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={(event) => {
        scale.set(withTiming(pressedScale, { duration: 150 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: 150 }));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
      {...props}
    />
  );
}
