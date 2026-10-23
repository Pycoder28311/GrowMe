import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SocialButton } from '@/components/ui/social-button';
import { SOCIAL_LINKS } from '@/config/app';
import { colors, space, titleFont } from '@/theme';

/** "Follow us": buttons that open the app's social pages */
export function FollowUs() {
  return (
    <View style={styles.root}>
      <AppText size="big" bold accessibilityRole="header" style={[styles.title, titleFont]}>
        Ακολούθησέ μας!
      </AppText>
      <View style={styles.row}>
        {SOCIAL_LINKS.map((link) => (
          <SocialButton key={link.label} label={link.label} role="link" onPress={() => Linking.openURL(link.url).catch(() => {})} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.sm,
  },
  title: {
    textShadowColor: colors.surface,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
});
