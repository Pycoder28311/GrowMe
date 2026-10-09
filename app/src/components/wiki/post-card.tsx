import type { Blog } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { readMinutes } from '@/lib/blogs';
import { alpha, colors, iconSize, size, space } from '@/theme';

// Tall enough for the photo to read, short enough to see the next card coming
const CARD_HEIGHT = size.touch * 6;

type PostCardProps = {
  post: Blog;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A post as a photo card: reading time in the corner, title and "see more" at the bottom.
 * Balcony ideas (kind «balcony») show the title under a smaller photo instead of on it.
 */
export function PostCard({ post, onPress, style }: PostCardProps) {
  const minutes = readMinutes(post);
  const cover = post.images[0];
  if (post.kind === 'balcony') {
    return (
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={`${post.name}, ${minutes} λεπτά ανάγνωση`}
        onPress={onPress}
        pressedScale={0.98}
        style={[styles.card, style]}>
        <View style={styles.balconyPhoto}>
          {cover ? (
            <Image source={{ uri: cover.url }} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.noPhoto} />
          )}
          <View style={styles.badge}>
            <ReadTimeBadge minutes={minutes} />
          </View>
        </View>
        <View style={styles.bottom}>
          <AppText bold numberOfLines={2}>
            {post.name}
          </AppText>
          <View style={styles.more}>
            <AppText size="small" bold color={colors.primary}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
          </View>
        </View>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${post.name}, ${minutes} λεπτά ανάγνωση`}
      onPress={onPress}
      pressedScale={0.98}
      style={[styles.card, style]}>
      {cover ? (
        <Image source={{ uri: cover.url }} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.noPhoto} />
      )}
      {/* Darkens the photo's lower part so the white title stays readable */}
      <View style={styles.shade} />

      <View style={styles.badge}>
        <ReadTimeBadge minutes={minutes} />
      </View>

      {/* The big title, then «Δες περισσότερα» at the bottom right */}
      <View style={styles.bottom}>
        <AppText bold color={colors.surface} style={styles.title}>
          {post.name}
        </AppText>
        <View style={[styles.more, styles.moreRight]}>
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
  // Balcony ideas: the photo fills the card above the title
  balconyPhoto: {
    flex: 1,
  },
  // Articles without a photo get a green card instead
  noPhoto: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
  },
  // Black from the bottom up to the middle, soft, so the white words read on any photo
  shade: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent 50%)',
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
  moreRight: {
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
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
