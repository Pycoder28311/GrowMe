import type { Post, PostReply } from '@growme/shared';
import { useCallback, useEffect, useId, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type EntryAnimationsValues,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { postRepliesApi, postsApi } from '@/api/posts';
import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostMorph } from '@/components/discussion/post-morph';
import { EditPostSheet } from '@/components/discussion/edit-post-sheet';
import { PostPhotos } from '@/components/discussion/post-photos';
import { ReplyLevel } from '@/components/discussion/reply-thread';
import { useTopClearance } from '@/components/layout/app-shell';
import { BotanicalBackground } from '@/components/layout/botanical-background';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { setCloseHandler, setPostModalOpen, type Box } from '@/lib/post-transition';
import { useSignedInId } from '@/lib/sign-in-gate';
import { useBackgroundScroll, useBackgroundScrollHandler } from '@/lib/background-motion';
import { timeAgo } from '@/lib/format';
import { usePost, usePostThread } from '@/lib/posts';
import { useReactions } from '@/lib/reactions';
import { LongLeafOutlineShape, PaperGrain } from '@/components/ui/flower-shapes';
import { botanical, colors, POSTS_COLORS, POSTS_DECORATIONS, space, tileGrain } from '@/theme';

/** The card's turn into the page (and back) lasts this long; what comes after waits for it */
export const MORPH_MS = 320;
/** One easing for the card growing and shrinking, so the two directions are mirror images of each other in time */
export const MORPH_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const REPLIES_DELAY_MS = MORPH_MS - 70;
/** The post's band is at least this tall below the corner buttons, even for a short text */
const POST_MIN_HEIGHT = 300;
/** The page's other content fades out / in over this while the card turns back / the page opens */
export const FADE_MS = 140;

const MELT_HEIGHT = 120;
/** An eased fade (smoothstep) so the gradient has no visible start or end */
const MELT_STOPS = Array.from({ length: 11 }, (_, i) => {
  const t = i / 10;
  return 1 - t * t * (3 - 2 * t);
});

/** The post's colour fading to nothing under it (drawn as an SVG gradient, which every device renders) */
function PostMelt() {
  const id = `melt-${useId().replace(/:/g, '')}`;
  return (
    <Svg pointerEvents="none" width="100%" height={MELT_HEIGHT}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {MELT_STOPS.map((opacity, i) => (
            <Stop key={i} offset={i / (MELT_STOPS.length - 1)} stopColor={POSTS_COLORS.post} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height={MELT_HEIGHT} fill={`url(#${id})`} />
    </Svg>
  );
}

type PostPageProps = {
  id: number;
  /** Open with the cursor in the reply field */
  write?: boolean;
  /** The list page's measured width, for the card's copy to grow to / shrink from */
  pageWidth?: number;
  /** Where the post's card is in the list: the page opens out of it and the × turns it back into it (modal) */
  origin?: Box | null;
  /** The card's growth, 0 → 1, while the list plays it: the page's background comes in with it */
  grow?: SharedValue<number>;
  /** The content shows (false while the card is still growing: only the background is there) */
  ready?: boolean;
  /** A modal over the list (the posts page), not a page of its own: it fills the screen and the × closes it here */
  modal?: boolean;
  /** Closed (after the card has shrunk back, for a modal; the page's own back otherwise) */
  onClose: () => void;
  /** The closing animation begins (the list brings its other posts back as it plays) */
  onClosing?: () => void;
  /** The author deleted the post (the list drops it; the page then closes without the animation) */
  onDeleted?: (id: number) => void;
};

/**
 * One community post with its replies, nested like Reddit; any reply can be answered. Over the posts list it is a
 * full-screen modal: the tapped card has grown into it, and the × turns it back into the card. Reached any other
 * way (a link) it is a page of its own.
 */
export function PostPage({ id, write = false, origin = null, pageWidth, grow, ready = true, modal = false, onClose, onClosing, onDeleted }: PostPageProps) {
  const topClearance = useTopClearance();
  const backgroundScroll = useBackgroundScrollHandler();
  const scrollY = useBackgroundScroll();
  const { post: loaded, state, retry, update } = usePost(id);
  // The author's edit shows at once (the loaded copy may not have arrived yet)
  const [edited, setEdited] = useState<Post | null>(null);
  const [editing, setEditing] = useState(false);
  const me = useSignedInId();
  const post = edited ?? loaded;
  const reduced = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const morph = useSharedValue(1);
  const leave = useSharedValue(0);
  const page = useAnimatedStyle(() => ({ opacity: 1 - leave.get() }));
  // The post band's height as it is now, for the closing copy to start from exactly it
  const [bandHeight, setBandHeight] = useState<number | undefined>(undefined);
  const closingNow = useSharedValue(0);
  // Closing: the copy of the band appears at once, exactly over it (so no crossfade, nothing visible behind the shrinking copy), and the real band goes
  const copy = useAnimatedStyle(() => ({ opacity: closingNow.get() ? 1 : 0 }));
  // The background: it comes in with the card's growth, and goes out as the card shrinks back
  const background = useAnimatedStyle(() => ({ opacity: closingNow.get() ? morph.get() : grow ? grow.get() : 1 }));
  const close = useCallback((): boolean => {
    if (closing) return true;
    if (!origin || !post || reduced) {
      // Without the animation a modal still closes itself; a page of its own goes back the usual way
      if (!modal) return false;
      onClosing?.();
      onClose();
      return true;
    }
    setClosing(true);
    closingNow.set(1);
    onClosing?.();
    // The band is swapped for its identical copy at once; the rest of the page fades out while the copy shrinks into the list's card
    leave.set(withTiming(1, { duration: FADE_MS }));
    morph.set(
      withTiming(0, { duration: MORPH_MS, easing: MORPH_EASING }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
    return true;
  }, [origin, post, reduced, modal, closing, leave, morph, closingNow, onClose, onClosing]);
  // The corner × asks this page first; a modal makes the corner an ×
  useEffect(() => {
    setCloseHandler(close);
    return () => setCloseHandler(null);
  }, [close]);
  useEffect(() => {
    if (!modal) return;
    setPostModalOpen(true);
    return () => setPostModalOpen(false);
  }, [modal]);
  const reactions = useReactions('post', post ? [post] : []);
  const thread = usePostThread(id);
  // Replies written on this page to the post itself (shown first)
  const [added, setAdded] = useState<PostReply[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The list's copy of the post is already here: only a post opened from elsewhere waits (and only this once)
  if (!post && state === 'loading') return <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />;
  if (!post) {
    return (
      <View style={[styles.notFound, { marginTop: topClearance }]}>
        <AppText color={colors.inkMuted} style={styles.center}>
          Η ανάρτηση δεν βρέθηκε ή δεν ήταν δυνατή η φόρτωσή της.
        </AppText>
        <PillButton label="Δοκίμασε ξανά" onPress={retry} />
      </View>
    );
  }

  // The post's band starts as tall as the card that grew into it, and opens to its full height (the card's words stay put)
  const startHeight = origin ? origin.height + topClearance : 0;
  const bandEntering =
    origin && !reduced
      ? (values: EntryAnimationsValues) => {
          'worklet';
          return {
            initialValues: { height: startHeight, originY: values.targetOriginY },
            animations: { height: withTiming(values.targetHeight, { duration: MORPH_MS, easing: MORPH_EASING }) },
          };
        }
      : undefined;
  const afterBand = FadeIn.delay(bandEntering ? MORPH_MS - 60 : 0).duration(FADE_MS * 2);

  const remove = () =>
    postsApi.remove(id).then(
      () => {
        onDeleted?.(id);
        onClosing?.();
        onClose();
      },
      () => {},
    );
  const countReply = () => update((p) => ({ ...p, replyCount: p.replyCount + 1 }));

  const reply = async (text: string) => {
    setError(null);
    try {
      const created = await postRepliesApi.create(post.id, null, text);
      setAdded((current) => [created, ...current]);
      countReply();
    } catch {
      setError('Η απάντηση δεν στάλθηκε. Δοκίμασε ξανά.');
    }
  };

  const { reaction, likeCount } = reactions.stateOf(post);

  return (
    <View pointerEvents={ready ? 'auto' : 'none'} style={modal ? styles.modal : styles.page}>
      {/* The same background as the posts list: the warm paper with the outlined leaves at its edges */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, background]}>
        <BotanicalBackground scrollY={scrollY} decorations={POSTS_DECORATIONS} color={POSTS_COLORS.page} />
      </Animated.View>
      {/* Everything but the background fades out when the × turns the page back into its card */}
      {ready && (
      <Animated.View style={[styles.fill, page]}>
      <Animated.ScrollView
        onScroll={backgroundScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.postWrap}>
          {/* The post reaches up to the top of the screen; its words start under the corner buttons */}
          <Animated.View
            entering={bandEntering}
            onLayout={(event) => {
              setBandHeight(event.nativeEvent.layout.height);
            }}
            style={[styles.block, styles.postBlock, { paddingTop: topClearance + space.md, minHeight: topClearance + POST_MIN_HEIGHT }, closing && styles.hidden]}>
            <PaperGrain opacity={tileGrain} />
            <DiscussionItem
              author={post.author.name}
              date={timeAgo(post.createdAt)}
              title={post.title}
              plant={post.plant}
              text={post.content}
              likeCount={likeCount}
              reaction={reaction}
              onReact={(pressed) => reactions.toggle(post, pressed)}
              replyCount={post.replyCount}
              roomy
              pinActions
              style={styles.fillItem}
              onEdit={post.author.id === me ? () => setEditing(true) : undefined}
              onDelete={post.author.id === me ? remove : undefined}
              actionSize={post.images.length > 0 ? 'normal' : 'small'}>
              <PostPhotos images={post.images} label={post.title} />
            </DiscussionItem>
            {(error || reactions.error) && (
              <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
                {error ?? 'Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.'}
              </AppText>
            )}
          </Animated.View>
          {/* The post's lower edge melts into the page: its colour fades out instead of ending in a line (after the band has opened) */}
          <Animated.View entering={afterBand}>
            <PostMelt />
          </Animated.View>
          {/* An outlined leaf in the bottom right corner, in front of the gradient and not cut by the post's edge */}
          <Animated.View pointerEvents="none" entering={afterBand} style={StyleSheet.absoluteFill}>
            <LongLeafOutlineShape size={180} color={botanical.leaf} glow={botanical.leaf} glowSpread={0.3} rotate={-35} opacity={0.15} style={styles.leaf} />
          </Animated.View>
        </View>

        {/* The replies (or the invitation to write the first) pop up under the post once it has opened, each a card like the list's posts */}
        <Animated.View entering={FadeInDown.delay(REPLIES_DELAY_MS).springify().damping(14).stiffness(120)} style={styles.replies}>
          <ReplyLevel source={thread} parentId={null} added={added} onReplied={countReply} cards />
          {post.replyCount === 0 && added.length === 0 && (
            <AppText color={colors.inkMuted} style={styles.noReplies}>
              Γράψε την πρώτη απάντηση!
            </AppText>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* The bottom field answers this post */}
      <BottomComposer placeholder="Γράψε απάντηση..." onSend={reply} autoFocus={write} />
      </Animated.View>
      )}

      {/* Closing with ×: the card's copy fades in over the page's top and shrinks back into the list's card */}
      {closing && origin && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, copy]}>
          <PostMorph post={post} from={origin} top={topClearance} progress={morph} pageWidth={pageWidth} full endHeight={bandHeight} />
        </Animated.View>
      )}

      {editing && (
        <EditPostSheet
          post={post}
          onSaved={(saved) => {
            setEdited(saved);
            update(() => saved);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The post fills its band (which has a minimum height), its buttons at the bottom
  fillItem: {
    flex: 1,
  },
  // The real band while closing: its copy is over it, so it goes at once (a style the layout animation can't override)
  hidden: {
    opacity: 0,
  },
  page: {
    flex: 1,
  },
  // Over the whole posts page
  modal: {
    ...StyleSheet.absoluteFill,
  },
  fill: {
    flex: 1,
  },
  // The post is a full-width band from the top of the screen; the replies are cards under it
  content: {
    paddingBottom: space.md,
  },
  block: {
    gap: space.sm,
    padding: space.md,
    backgroundColor: colors.surface,
  },
  // The post itself: the list card's warm paper, full width
  postBlock: {
    backgroundColor: POSTS_COLORS.post,
    overflow: 'hidden',
  },
  // Under the post, apart from it and from each other
  replies: {
    gap: space.sm,
    // Up into the fade: the first card starts while the post is still melting away
    marginTop: -MELT_HEIGHT * 0.6,
    paddingTop: space.md,
  },
  // The post and its melt: above the replies, so the leaf at its lower right corner can reach over them
  postWrap: {
    zIndex: 1,
  },
  // Up in the fade, above the post's lower edge
  leaf: {
    right: -30,
    bottom: MELT_HEIGHT * 0.45,
  },
  // Just the words, lined up with the cards' edges
  noReplies: {
    paddingHorizontal: space.md,
  },
  notFound: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  center: {
    textAlign: 'center',
  },
});
