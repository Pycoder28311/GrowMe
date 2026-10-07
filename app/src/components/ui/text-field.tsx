import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, fontFamily, fontSize, radius, space } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown under the field in red */
  error?: string | null;
};

/** A labelled text input in the app's style, with its error under it */
export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.root}>
      <AppText size="small" color={colors.inkMuted}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, !!error && styles.invalid, style]}
        {...props}
      />
      {error ? (
        <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.xs,
  },
  input: {
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  invalid: {
    borderColor: colors.accent,
  },
});
