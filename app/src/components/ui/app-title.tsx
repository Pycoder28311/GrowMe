import { StyleSheet } from 'react-native';

import { PopInText } from '@/components/ui/pop-in-text';
import { APP_NAME } from '@/config/app';
import { colors } from '@/theme';

/** The app name as a green wordmark with a thick white outline round every letter, popping in letter by letter */
export function AppTitle() {
  return <PopInText text={APP_NAME} size="big" bold color={colors.primary} letterStyle={styles.letter} outline={OUTLINE} />;
}

/** The outline's thickness at the title's size (56): thick, but the letters still read as letters */
const OUTLINE = 4;

const styles = StyleSheet.create({
  letter: {
    fontSize: 56,
    lineHeight: 64,
  },
});
