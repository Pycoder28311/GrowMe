import { StyleSheet } from 'react-native';

import { PopInText } from '@/components/ui/pop-in-text';
import { APP_NAME } from '@/config/app';
import { colors } from '@/theme';

/** The app name as a green wordmark with a white rim, popping in letter by letter */
export function AppTitle() {
  return <PopInText text={APP_NAME} size="big" bold color={colors.primary} letterStyle={styles.rim} />;
}

const styles = StyleSheet.create({
  // A soft white rim around each letter so the green reads over any photo
  rim: {
    textShadowColor: colors.surface,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
