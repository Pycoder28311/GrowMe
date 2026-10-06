import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { space } from '@/theme';

/** A titled group on a page or sheet (e.g. "Εποχή" and its options, or a plant's tips) */
export function Section({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View>
      <AppText bold accessibilityRole="header" style={children ? styles.title : undefined}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: space.md,
  },
});
