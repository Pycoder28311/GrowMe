import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { quietGray, size, space } from '@/theme';

/** A small light-gray badge with a reading time in minutes (e.g. 3′): small corners, no border */
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
    borderRadius: 6,
    backgroundColor: quietGray,
    paddingHorizontal: space.sm,
  },
});
