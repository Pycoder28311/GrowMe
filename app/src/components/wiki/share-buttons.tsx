import { Share, StyleSheet, View } from 'react-native';

import { SocialButton } from '@/components/ui/social-button';
import { space } from '@/theme';

const APPS = ['Facebook', 'Instagram'];

/** Share a post. Each button opens the phone's share menu, where the chosen app is picked. */
export function ShareButtons({ title }: { title: string }) {
  const share = () => Share.share({ message: title }).catch(() => {});

  return (
    <View style={styles.row}>
      {APPS.map((app) => (
        <SocialButton key={app} label={app} onPress={share} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
});
