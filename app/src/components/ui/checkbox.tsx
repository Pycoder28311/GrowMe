import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, space } from '@/theme';

type CheckboxProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

/** A square tick box with its label; the whole row is tappable */
export function Checkbox({ label, checked, onToggle }: CheckboxProps) {
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      pressedScale={0.98}
      style={styles.row}>
      <View style={[styles.box, checked && styles.checked]}>
        {checked && <Icon name="check" size={iconSize.small} color={colors.surface} bold />}
      </View>
      <AppText>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
  },
  box: {
    width: iconSize.normal,
    height: iconSize.normal,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    borderColor: colors.inkMuted,
    backgroundColor: colors.surface,
  },
  checked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
