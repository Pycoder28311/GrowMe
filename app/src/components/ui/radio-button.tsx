import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, space } from '@/theme';

type RadioButtonProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};

/** One choice of a single-choice group: a round mark with its label */
export function RadioButton({ label, selected, onSelect }: RadioButtonProps) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
      pressedScale={0.98}
      style={styles.row}>
      <View style={[styles.circle, selected && styles.selected]}>{selected && <View style={styles.dot} />}</View>
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
  circle: {
    width: iconSize.normal,
    height: iconSize.normal,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.inkMuted,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
  },
  dot: {
    width: iconSize.normal / 2,
    height: iconSize.normal / 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
});
