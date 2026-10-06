import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { alpha, colors, radius, size, space } from '@/theme';

/** Small round badge with a reading time in minutes (e.g. 3′) */
export function ReadTimeBadge({ minutes }: { minutes: number }) {
  return (
    <View accessibilityLabel={`${minutes} λεπτά ανάγνωση`} style={styles.badge}>
      <AppText size="small" bold>
        {minutes}′
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: size.touch / 1.5,
    height: size.touch / 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.9),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.sm,
  },
});
