import type { Blog } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LongLeafOutlineShape, PaperGrain } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { publishedDate, readMinutes } from '@/lib/blogs';
import { botanical, iconSize, radius, serif, size, space, tileGrain, tileShadowStyle, tileTone } from '@/theme';

// Tall enough for the photo to read, short enough to see the next card coming
const PHOTO_HEIGHT = size.touch * 4;
const AVATAR = 36;
/** The paper's grain over the whole card (photo and flowers too), a little rougher than the plant page's tiles */
const GRAIN = Math.min(1, tileGrain * 1.5);

type PostCardProps = {
  post: Blog;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A post as a paper card in the plant page's look: the photo with the reading time in the corner, then on the
 * beige paper (with its grain) the title in a big serif, the date beside a small leaf badge, «Δες περισσότερα»,
 * and two outlined leaves in the bottom right corner.
 */
export function PostCard({ post, onPress, style }: PostCardProps) {
  const minutes = readMinutes(post);
  const cover = post.images[0];
  const paper = tileTone(0).background;
  return (
    // The shadow sits on an outer view: the card clips its photo and flowers, which would cut a shadow
    <View style={[styles.shadow, { backgroundColor: paper }, style]}>
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={`${post.name}, ${minutes} λεπτά ανάγνωση`}
        onPress={onPress}
        pressedScale={0.98}
        style={[styles.card, { backgroundColor: paper }]}
      >
        <View style={styles.photo}>
          {cover ? (
            <Image source={{ uri: cover.url }} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.noPhoto} />
          )}
          <View style={styles.badge}>
            <ReadTimeBadge minutes={minutes} />
          </View>
        </View>

        {/* Two outlined leaves in the bottom right corner, partly past the card's edge (it clips them) */}
        <LongLeafOutlineShape size={130} color={botanical.leaf} glow={botanical.leaf} glowSpread={0.3} rotate={-38} opacity={0.6} style={styles.leafBack} />
        <LongLeafOutlineShape size={100} color={botanical.leaf} glow={botanical.leaf} glowSpread={0.3} rotate={22} opacity={0.6} style={styles.leafFront} />
        <PaperGrain opacity={GRAIN} />

        <View style={styles.bottom}>
          <AppText bold numberOfLines={3} color={botanical.oliveDark} style={styles.title}>
            {post.name}
          </AppText>
          <View style={styles.dateRow}>
            <View style={styles.avatar}>
              <Icon name="leaf" size={iconSize.normal} color={botanical.cream} />
            </View>
            <AppText color={botanical.inkMuted}>{publishedDate(post)}</AppText>
          </View>
          <View style={styles.more}>
            <AppText bold color={botanical.oliveDark}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={botanical.oliveDark} bold />
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.md,
    ...tileShadowStyle,
  },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photo: {
    height: PHOTO_HEIGHT,
  },
  // Articles without a photo get a green block instead
  noPhoto: {
    ...StyleSheet.absoluteFill,
    backgroundColor: botanical.olive,
  },
  badge: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    opacity: 0.95,
  },
  bottom: {
    gap: space.sm,
    padding: space.md,
    // Room on the right for the flowers
    paddingRight: space.lg + space.md,
  },
  title: {
    fontFamily: serif,
    fontSize: 28,
    lineHeight: 34,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: botanical.olive,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  // The corner's leaves
  leafBack: {
    right: -28,
    bottom: -30,
  },
  leafFront: {
    right: 40,
    bottom: -34,
  },
});
