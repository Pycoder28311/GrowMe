import type { ReactElement } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { FacebookIcon, InstagramIcon } from '@/components/home/social-icons';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SOCIAL_LINKS } from '@/config/app';
import { colors, iconSize, radius, space, titleFont } from '@/theme';

/** The mark of each network, by the link's label */
const MARKS: Record<string, () => ReactElement> = {
  Facebook: () => <FacebookIcon />,
  Instagram: () => <InstagramIcon />,
};

/** "Follow us": buttons that open the app's social pages */
export function FollowUs() {
  return (
    <View style={styles.root}>
      <AppText size="big" bold accessibilityRole="header" style={[styles.title, titleFont]}>
        Ακολούθησέ μας!
      </AppText>
      <View style={styles.row}>
        {SOCIAL_LINKS.map((link) => (
          <PressableScale
            key={link.label}
            accessibilityRole="link"
            accessibilityLabel={link.label}
            onPress={() => Linking.openURL(link.url).catch(() => {})}
            pressedScale={0.97}
            style={styles.button}>
            {MARKS[link.label]?.()}
            <AppText>{link.label}</AppText>
            {/* A forward arrow: it leaves the app for that page */}
            <Icon name="send" size={iconSize.small} color={colors.inkMuted} bold />
          </PressableScale>
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
  // The network's mark, its name, a forward arrow on the right
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs + 2,
    paddingLeft: space.sm,
    paddingRight: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
