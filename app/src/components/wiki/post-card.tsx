import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import type { WikiPost } from '@/config/wiki-posts';
import { alpha, colors, iconSize, size, space } from '@/theme';

// Tall enough for the photo to read, short enough to see the next card coming
const CARD_HEIGHT = size.touch * 6;

type PostCardProps = {
  post: WikiPost;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A post as a photo card: reading time in the corner, title and "see more" at the bottom */
export function PostCard({ post, onPress, style }: PostCardProps) {
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${post.title}, ${post.readMinutes} λεπτά ανάγνωση`}
      onPress={onPress}
      pressedScale={0.98}
      style={[styles.card, style]}>
      <Image source={post.image} contentFit="cover" style={StyleSheet.absoluteFill} />
      {/* Darkens the photo's lower part so the white title stays readable */}
      <View style={styles.shade} />

      <View style={styles.badge}>
        <ReadTimeBadge minutes={post.readMinutes} />
      </View>

      <View style={styles.bottom}>
        <AppText size="big" bold color={colors.surface} style={styles.title}>
          {post.title}
        </AppText>
        <View style={styles.more}>
          <AppText bold color={colors.surface}>
            Δες περισσότερα
          </AppText>
          <Icon name="chevronRight" size={iconSize.small} color={colors.surface} bold />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  shade: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: `linear-gradient(to bottom, transparent 35%, ${alpha(colors.ink, 0.75)})`,
  },
  badge: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
  },
  bottom: {
    gap: space.sm,
    padding: space.md,
  },
  title: {
    textShadowColor: alpha(colors.ink, 0.5),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
