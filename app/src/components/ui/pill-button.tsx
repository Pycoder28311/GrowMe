import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, radius, space } from '@/theme';

type PillButtonProps = {
  label: string;
  onPress?: () => void;
};

/** A rounded, outlined text button (e.g. a suggested search) */
export function PillButton({ label, onPress }: PillButtonProps) {
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} pressedScale={0.97} style={styles.pill}>
      <AppText>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
