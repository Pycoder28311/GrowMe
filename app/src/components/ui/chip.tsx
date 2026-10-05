import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, space } from '@/theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

/** A filter option that can be switched on and off */
export function Chip({ label, selected, onToggle }: ChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onToggle}
      pressedScale={0.97}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}>
      {selected && <Icon name="check" size={iconSize.small} color={colors.primary} bold />}
      <AppText color={selected ? colors.primary : colors.ink}>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  unselected: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
