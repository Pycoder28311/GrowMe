import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, space } from '@/theme';

/** Its height, so a field can line its last row up with it */
export const SEND_BUTTON_HEIGHT = 36;

/** «Αποστολή ›»: the send button of every message field (replies, comments, posts) */
export function SendButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Αποστολή"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.96}
      style={[styles.button, disabled && styles.disabled]}>
      <AppText size="small" bold color={colors.surface}>
        Αποστολή
      </AppText>
      <Icon name="chevronRight" size={iconSize.small} color={colors.surface} bold />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: SEND_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: space.md,
    paddingRight: space.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
});
