import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, shadow, space } from '@/theme';

/** Its height, so the page can leave room for it */
export const DESCRIPTION_BUTTON_HEIGHT = 40;

/**
 * «Δες την περιγραφή»: a short full-width button just above the bottom bar, while the description is
 * still below the screen. The page shows it (`visible`) and scrolls on press.
 */
export function DescriptionButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.wrap}>
      <PressableScale accessibilityRole="button" onPress={onPress} pressedScale={0.98} style={styles.button}>
        <AppText bold color={colors.primary}>
          Δες την περιγραφή
        </AppText>
        <Icon name="chevronDown" size={iconSize.normal} color={colors.primary} bold />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.sm,
  },
  button: {
    height: DESCRIPTION_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    boxShadow: shadow.button,
  },
});
