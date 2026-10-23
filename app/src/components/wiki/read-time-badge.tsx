import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { botanical, radius, serif, size, space, tileGrain } from '@/theme';

/** A small cream paper pill (the cards' beige, with their grain and a thin outline) with a reading time in minutes (e.g. 3′) */
export function ReadTimeBadge({ minutes }: { minutes: number }) {
  return (
    <View accessibilityLabel={`${minutes} λεπτά ανάγνωση`} style={styles.badge}>
      <PaperGrain opacity={tileGrain} />
      <AppText bold color={botanical.oliveDark} style={styles.text}>
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
    borderWidth: 1,
    borderColor: botanical.line,
    backgroundColor: botanical.cream,
    paddingHorizontal: space.sm,
    overflow: 'hidden',
  },
  text: {
    fontFamily: serif,
    fontSize: 14,
    lineHeight: 18,
  },
});
