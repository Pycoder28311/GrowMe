import { Platform, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { alpha, colors, type FontSize } from '@/theme';

/** How many white copies go round the letter (enough that a thick outline has no notches) */
const COPIES = 16;
const ANGLES = Array.from({ length: COPIES }, (_, i) => (i / COPIES) * 2 * Math.PI);

type OutlinedTextProps = {
  children: string;
  color: string;
  /** The outline's thickness (px) */
  outline: number;
  outlineColor?: string;
  size?: FontSize;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  /** Extra style for the real text only (not the outline's copies), e.g. a shadow */
  mainStyle?: StyleProp<TextStyle>;
  /** A glow spreading out from the letters, behind the outline (colour, and how far it spreads in px) */
  glow?: { color: string; radius: number };
};

/**
 * Text with a thick outline round every letter. Text has no outline in React Native, so the outline is
 * copies of the text in the outline colour, moved round the real one (the same on every platform).
 */
export function OutlinedText({ children, color, outline, outlineColor = colors.surface, size, bold, style, mainStyle, glow }: OutlinedTextProps) {
  return (
    <View>
      {/* The glow on phones: one soft gradient behind the text (big text shadows are slow to draw there, and
          Android cuts them off at the text's box) */}
      {glow && Platform.OS !== 'web' && (
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              top: -glow.radius,
              bottom: -glow.radius,
              left: -glow.radius,
              right: -glow.radius,
              experimental_backgroundImage: `radial-gradient(${alpha(glow.color, 0.75)}, ${alpha(glow.color, 0.45)} 40%, transparent 70%)`,
            },
          ]}
        />
      )}
      {/* The glow on the web: the text five times, behind everything, each throwing a big soft shadow all round */}
      {glow &&
        Platform.OS === 'web' &&
        [0, 1, 2, 3, 4].map((i) => (
          <AppText
            key={`glow${i}`}
            size={size}
            bold={bold}
            color={glow.color}
            style={[
              style,
              styles.copy,
              { textShadowColor: glow.color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: glow.radius },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            {children}
          </AppText>
        ))}
      {ANGLES.map((angle, i) => (
        <AppText
          key={i}
          size={size}
          bold={bold}
          color={outlineColor}
          // Moved with a transform, not left/top: a copy shifted right would get less width than the real
          // text and wrap onto a second line (a doubled word)
          style={[style, styles.copy, { transform: [{ translateX: Math.cos(angle) * outline }, { translateY: Math.sin(angle) * outline }] }]}
          // The real text below is the one that is read
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {children}
        </AppText>
      ))}
      <AppText size={size} bold={bold} color={color} style={[style, mainStyle]}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
  copy: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
