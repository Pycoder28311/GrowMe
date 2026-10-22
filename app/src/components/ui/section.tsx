import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { space, titleFont } from '@/theme';

/** A titled group on a page or sheet (e.g. "Εποχή" and its options, or a plant's tips) */
export function Section({
  title,
  titleStyle,
  children,
}: {
  title: string;
  /** A page's own title look (e.g. the plant page's serif) */
  titleStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
}) {
  return (
    <View>
      <AppText bold accessibilityRole="header" style={[children ? styles.title : undefined, titleFont, titleStyle]}>
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
