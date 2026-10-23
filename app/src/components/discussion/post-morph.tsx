import type { Post } from '@growme/shared';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { timeAgo } from '@/lib/format';
import { useReactions } from '@/lib/reactions';
import { useSignedInId } from '@/lib/sign-in-gate';
import type { Box } from '@/lib/post-transition';
import { POSTS_COLORS, radius, space, tileGrain, tileShadowStyle } from '@/theme';

/**
 * A post's card as it turns into the post's page (and back): `progress` 0 is the card where it sits in the list
 * (`from`, rounded, with its shadow), 1 is the full-width band at the top of the screen with square corners, its
 * words below the corner buttons (`top`). The screen that plays it drives `progress`.
 */
export function PostMorph({
  post,
  from,
  top,
  progress,
  pageWidth,
  full = false,
  endHeight,
}: {
  post: Post;
  from: Box;
  top: number;
  progress: SharedValue<number>;
  /** The page's real width (the list's page, measured): the window's can differ from it (scrollbar, a web window) */
  pageWidth?: number;
  /** The page's own look at progress 1 (all the text, the photos at full size), cut off by the shrinking frame: for closing, so the copy starts exactly as the page is */
  full?: boolean;
  /** The frame's height at progress 1 (default: the card's height and the corner buttons' room) */
  endHeight?: number;
}) {
  const me = useSignedInId();
  const window = useWindowDimensions().width;
  const width = pageWidth ?? window;
  const reactions = useReactions('post', [post]);
  const { reaction, likeCount } = reactions.stateOf(post);
  const frame = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      left: from.left * (1 - p),
      top: from.top * (1 - p),
      width: from.width + (width - from.width) * p,
      // Up to the screen's top: the page starts there, its words below the corner buttons
      height: from.height + ((endHeight ?? from.height + top) - from.height) * p,
      borderRadius: radius.md * (1 - p),
    };
  });
  const shadow = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const words = useAnimatedStyle(() => ({ paddingTop: top * progress.get() }));
  return (
    <Animated.View pointerEvents="none" style={[styles.morph, frame]}>
      <Animated.View style={[StyleSheet.absoluteFill, tileShadowStyle, shadow]} />
      <PaperGrain opacity={tileGrain} />
      <Animated.View style={[styles.words, words]}>
        <DiscussionItem
          author={post.author.name}
          date={timeAgo(post.createdAt)}
          title={post.title}
          plant={post.plant}
          text={post.content}
          textLines={full ? undefined : 3}
          likeCount={likeCount}
          reaction={reaction}
          onReact={() => {}}
          replyCount={post.replyCount}
          actionSize={post.images.length > 0 ? 'normal' : 'small'}
          morph={progress}
          pinActions
          onEdit={post.author.id === me ? () => {} : undefined}
          onDelete={post.author.id === me ? () => {} : undefined}
          style={styles.item}>
          <PostPhotos images={post.images} label={post.title} compact={!full} />
        </DiscussionItem>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  morph: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: POSTS_COLORS.post,
  },
  // The words fill the frame, the buttons at its bottom (like the page's band, which is taller than its text)
  words: {
    flex: 1,
  },
  // The same padding as the list's cards
  item: {
    flex: 1,
    padding: space.md,
    paddingBottom: space.xs,
  },
});
