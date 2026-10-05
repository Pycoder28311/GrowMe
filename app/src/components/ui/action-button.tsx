import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, radius, shade, shadow, space } from '@/theme';

const FILLS = { orange: colors.accent, green: colors.primary };

// Side padding: lg for the big call to action (room for its arrow), md for everything else
const SIDE_PADDING = { lg: space.lg * 2, md: space.lg };

// Brightness of the top edge line, the shine from above and the reflection from below
const GLOW = {
  full: { line: 0.5, shine: [0.32, 0.16], reflection: [0.15, 0.08] },
  soft: { line: 0.2, shine: [0.12, 0.06], reflection: [0.06, 0.03] },
};

// A wide ellipse of white light, fading out towards its rim (only part of it shows inside the button)
const light = ([inner, middle]: number[]) =>
  `radial-gradient(closest-side, ${alpha(colors.surface, inner)}, ${alpha(colors.surface, middle)} 60%, transparent)`;

type ActionButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  color?: keyof typeof FILLS;
  size?: keyof typeof SIDE_PADDING;
  /** Darker line along the bottom edge */
  edge?: boolean;
  glow?: keyof typeof GLOW;
  style?: StyleProp<ViewStyle>;
};

/** The Plant demo's main button: colored, with a soft shine on top and a darker bottom edge */
export function ActionButton({
  children,
  onPress,
  color = 'orange',
  size = 'lg',
  edge = true,
  glow = 'full',
  style,
}: ActionButtonProps) {
  const [pressed, setPressed] = useState(false);
  const { line, shine, reflection } = GLOW[glow];

  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressedScale={0.97}
      style={[styles.shadow, style]}>
      <View
        style={[
          styles.body,
          {
            backgroundColor: FILLS[color],
            paddingHorizontal: SIDE_PADDING[size],
            boxShadow: `inset 0 1px 0 ${alpha(colors.surface, line)}`,
          },
          edge && styles.edge,
        ]}>
        <View pointerEvents="none" style={[styles.shine, { experimental_backgroundImage: light(shine) }]} />
        <View pointerEvents="none" style={[styles.reflection, { experimental_backgroundImage: light(reflection) }]} />
        {pressed && <View pointerEvents="none" style={styles.pressed} />}
        {children}
      </View>
    </PressableScale>
  );
}

/** White bold label for an ActionButton; `shadow` adds the playful solid drop under the letters */
export function ActionButtonText({ children, shadow: withShadow, style }: { children: ReactNode; shadow?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <AppText size="big" bold color={colors.surface} style={[withShadow && styles.textShadow, style]}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.sm,
    boxShadow: shadow.button,
  },
  body: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edge: {
    borderBottomWidth: space.xs,
    borderBottomColor: shade,
  },
  shine: {
    position: 'absolute',
    left: '-10%',
    top: '-50%',
    width: '120%',
    height: '100%',
    borderRadius: radius.full,
  },
  reflection: {
    position: 'absolute',
    left: '-10%',
    bottom: '-60%',
    width: '120%',
    height: '100%',
    borderRadius: radius.full,
  },
  pressed: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.ink, 0.1),
  },
  textShadow: {
    textShadowColor: shade,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
