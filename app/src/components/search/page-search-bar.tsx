import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { raisedTile } from '@/components/ui/styles';
import { alpha, colors, fontFamily, fontSize, iconSize, radius, size, space } from '@/theme';

const PLACEHOLDER = 'Αναζήτηση φυτών';

/**
 * A search bar that stays on a page, full width under the corner buttons. It only holds the text:
 * the page filters its own list below with it (no panel of results).
 */
export function PageSearchBar({ top, value, onChangeText }: { top: number; value: string; onChangeText: (text: string) => void }) {
  const barWidth = useWindowDimensions().width - 2 * space.md;
  return (
    <Animated.View
      entering={FadeIn}
      accessibilityRole="search"
      style={[raisedTile, styles.bar, { top, left: space.md, width: barWidth }]}>
      <View pointerEvents="none" style={styles.icon}>
        <Icon name="search" size={iconSize.big} color={colors.inkMuted} style={styles.faint} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={PLACEHOLDER}
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel={PLACEHOLDER}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    zIndex: 15,
    height: size.touch,
    backgroundColor: alpha(colors.surface, 0.97),
  },
  icon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faint: {
    opacity: 0.55,
  },
  input: {
    ...StyleSheet.absoluteFill,
    paddingLeft: size.touch,
    paddingRight: space.md,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    borderRadius: radius.sm,
  },
});
