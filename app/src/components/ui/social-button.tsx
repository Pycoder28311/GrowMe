import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { FacebookIcon, InstagramIcon } from '@/components/home/social-icons';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { botanical, radius, space } from '@/theme';

/** The mark of each network, by its name, in the page's olive */
const MARKS: Record<string, () => ReactElement> = {
  Facebook: () => <FacebookIcon color={botanical.oliveDark} />,
  Instagram: () => <InstagramIcon color={botanical.oliveDark} />,
};

/**
 * A social network's button, the same wherever the app has one (sharing an article, «Ακολούθησέ μας»): a cream pill
 * with a thin warm outline, the network's mark in olive and its name.
 */
export function SocialButton({ label, onPress, role = 'button' }: { label: string; onPress?: () => void; role?: 'button' | 'link' }) {
  return (
    <PressableScale accessibilityRole={role} accessibilityLabel={label} onPress={onPress} pressedScale={0.97} style={styles.button}>
      {MARKS[label]?.()}
      <AppText color={botanical.ink}>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    paddingVertical: space.xs + 2,
    paddingLeft: space.sm,
    paddingRight: space.md + space.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(214, 116, 95, 0.28)',
    backgroundColor: botanical.cream,
  },
});
