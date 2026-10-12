import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { FontSize } from '@/theme';

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
export function OutlinedText({ children, color, outline, outlineColor = '#ffffff', size, bold, style, mainStyle, glow }: OutlinedTextProps) {
  return (
    <View>
      {/* The glow: the text five times, behind everything, each throwing a big soft shadow all round */}
      {glow &&
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
  copy: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
