import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { botanical, iconSize, radius, serif, space, tileGrain, tileTone } from '@/theme';

/** Its height, so the page can leave room for it */
export const DESCRIPTION_BUTTON_HEIGHT = 40;

/**
 * «Δες την περιγραφή»: a cream pill with a thin outline across the width, just above the bottom bar, while the description is
 * still below the screen. The page shows it (`visible`) and scrolls on press.
 */
export function DescriptionButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.wrap}>
      <PressableScale accessibilityRole="button" onPress={onPress} pressedScale={0.98} style={styles.button}>
        <PaperGrain opacity={tileGrain} />
        <AppText color={botanical.ink} style={styles.label}>
          Δες την περιγραφή
        </AppText>
        <Icon name="chevronDown" size={iconSize.normal} color={botanical.ink} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.xs,
  },
  button: {
    height: DESCRIPTION_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: botanical.line,
    backgroundColor: tileTone(0).background,
    overflow: 'hidden',
  },
  label: {
    fontFamily: serif,
    fontSize: 16,
  },
});
