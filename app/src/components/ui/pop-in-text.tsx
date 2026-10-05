import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { popIn } from '@/components/ui/pop-in';
import type { FontSize } from '@/theme';

const LETTER_DELAY_MS = 40;

type PopInTextProps = {
  text: string;
  size?: FontSize;
  bold?: boolean;
  color?: string;
  /** Applied to every letter (e.g. shadows) */
  letterStyle?: StyleProp<TextStyle>;
};

/** Text whose letters pop in one after another, left to right, when it first appears */
export function PopInText({ text, size, bold, color, letterStyle }: PopInTextProps) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={text} style={styles.row}>
      {Array.from(text).map((letter, index) => (
        <Animated.View key={index} entering={popIn(index * LETTER_DELAY_MS)} importantForAccessibility="no">
          <AppText size={size} bold={bold} color={color} style={letterStyle}>
            {letter}
          </AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
