import type { Blog } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { publishedDate, readMinutes } from '@/lib/blogs';
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
        style={[styles.card, styles.balconyCard, style]}>
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
          <View style={styles.titleBlock}>
            <AppText bold numberOfLines={2}>
              {post.name}
            </AppText>
            <AppText size="small" color={colors.inkMuted}>
              {publishedDate(post)}
            </AppText>
          </View>
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

      {/* At the bottom: the title, then the date on the left and «Δες περισσότερα» on the right, level */}
      <View style={styles.bottom}>
        <AppText bold color={colors.surface} style={styles.title}>
          {post.name}
        </AppText>
        <View style={styles.footerRow}>
          <AppText color={alpha(colors.surface, 0.85)} style={styles.date}>
            {publishedDate(post)}
          </AppText>
          <View style={styles.more}>
            <AppText bold color={colors.surface}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.surface} bold />
          </View>
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
  // Balcony ideas: a deeper shadow than the other cards', so they lift off the page
  balconyCard: {
    boxShadow: `0 10px 28px ${alpha(colors.ink, 0.28)}, 0 3px 8px ${alpha(colors.ink, 0.16)}`,
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
  // Black from the bottom up, deep at the bottom and fading out smoothly over most of the card, so the
  // white words read on any photo
  shade: {
    ...StyleSheet.absoluteFill,
    // A big inner shadow along the bottom edge, plus the gradient above it
    boxShadow: 'inset 0 -90px 60px -30px rgba(0, 0, 0, 0.8)',
    experimental_backgroundImage:
      'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 25%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.1) 70%, transparent 85%)',
  },
  // Faint, so it doesn't compete with the photo
  badge: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    opacity: 0.6,
  },
  bottom: {
    gap: space.sm,
    padding: space.md,
  },
  // The date and «Δες περισσότερα» on one line
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // The balcony card's title and its date
  titleBlock: {
    gap: space.xs,
  },
  date: {
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: alpha(colors.ink, 0.5),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
