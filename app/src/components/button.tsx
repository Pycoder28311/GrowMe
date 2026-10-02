import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, destructive, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed]}>
      <ThemedText type="smallBold" style={{ color: destructive ? '#e5484d' : '#3c87f7' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  dimmed: {
    opacity: 0.5,
  },
});
