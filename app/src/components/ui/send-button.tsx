import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { SendIcon } from '@/components/ui/send-icon';
import { colors, iconSize, radius, shadow, size } from '@/theme';

/** Its height, so a field can line its last row up with it */
export const SEND_BUTTON_HEIGHT = size.touch;

/** The look of every send button: a green rounded square */
export const sendButtonStyle = {
  width: size.touch,
  height: size.touch,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radius.xs,
  backgroundColor: colors.primary,
  boxShadow: shadow.button,
} as const;

/** The paper-plane button of every message field (replies, comments, posts); the question form's one flies */
export function SendButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Αποστολή"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.94}
      style={[sendButtonStyle, disabled && styles.disabled]}>
      <SendIcon size={iconSize.big} color={colors.surface} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
});
