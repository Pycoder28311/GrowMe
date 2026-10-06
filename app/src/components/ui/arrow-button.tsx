import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, iconSize, radius, shadow, size } from '@/theme';

type ArrowButtonProps = {
  direction: 'previous' | 'next';
  /** Read by screen readers, e.g. "Επόμενη φωτογραφία" */
  label: string;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Round ‹ › button laid over a carousel; fades when there is nothing further that way */
export function ArrowButton({ direction, label, disabled, onPress, style }: ArrowButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled, style]}>
      <Icon name={direction === 'previous' ? 'chevronLeft' : 'chevronRight'} size={iconSize.big} color={colors.ink} bold />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.85),
    boxShadow: shadow.raised,
  },
  disabled: {
    opacity: 0.4,
  },
});
