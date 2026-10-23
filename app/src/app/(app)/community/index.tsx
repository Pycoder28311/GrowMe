import type { Post, PostSort } from '@growme/shared';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BottomBar } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { SortMenu } from '@/components/discussion/sort-menu';
import { AskCard } from '@/components/home/ask-card';
import { BotanicalBackground } from '@/components/layout/botanical-background';
import { useTopClearance } from '@/components/layout/app-shell';
import { TopGradient } from '@/components/layout/top-gradient';
import { TopWash } from '@/components/layout/top-wash';
import { AppText } from '@/components/ui/app-text';
import { PostMorph } from '@/components/discussion/post-morph';
import { MORPH_EASING, MORPH_MS, PostPage } from '@/components/discussion/post-page';
import { postsApi } from '@/api/posts';
import { EditPostSheet } from '@/components/discussion/edit-post-sheet';
import { PostPaper } from '@/components/discussion/post-paper';
import { PillButton } from '@/components/ui/pill-button';
import { useBackgroundScroll, useBackgroundScrollHandler } from '@/lib/background-motion';
import { timeAgo } from '@/lib/format';
import { LIST_TUNING } from '@/lib/list-tuning';
import { useSignedInId } from '@/lib/sign-in-gate';
import { seedPost, usePosts } from '@/lib/posts';
import { runCloseHandler, type Box } from '@/lib/post-transition';
import { useReactions } from '@/lib/reactions';
import { colors, POSTS_COLORS, POSTS_DECORATIONS, space, titleFont } from '@/theme';

/** The page behind the posts (a soft, less warm cream) and the posts on it (a warmer peach cream) */
const PAGE_COLOR = POSTS_COLORS.page;
const POST_COLOR = POSTS_COLORS.post;

/** How much the other posts fade while one opens (0–1) */
const OTHERS_FADE = 0.6;

/** Users' questions, newest first (more load while scrolling), with a field to write a new one */
export default function CommunityScreen() {
  const topClearance = useTopClearance();
  const backgroundScroll = useBackgroundScrollHandler();
  const scrollY = useBackgroundScroll();
  const [sort, setSort] = useState<PostSort>('newest');
  // The form floats over the list: the list leaves room for it at the end
  const [formHeight, setFormHeight] = useState(0);
  const { posts, loading, error, loadMore, refresh, update } = usePosts(sort);
  const reactions = useReactions('post', posts);
  const reduced = useReducedMotion();
  const me = useSignedInId();
  // The post being edited (its author's own)
  const [editing, setEditing] = useState<Post | null>(null);
  // Deleting an own post: gone from the server, then from the list
  const remove = (post: Post) =>
    postsApi.remove(post.id).then(
      () => update((current) => current.filter((p) => p.id !== post.id)),
      () => {},
    );
  const pageRef = useRef<View>(null);
  const cardRefs = useRef(new Map<number, View | null>());
  // The post open over the list (a full-screen modal): the card it grew from, and whether the growth is over (then
  // the page shows). The card's copy grows while the list's other posts fade back
  const [opened, setOpened] = useState<{ post: Post; write: boolean; from: Box; pageWidth: number; ready: boolean } | null>(null);
  // 0 → 1 while it opens: the card grows and the other posts fade back
  const progress = useSharedValue(0);
  const others = useAnimatedStyle(() => ({ opacity: 1 - OTHERS_FADE * progress.get() }));

  const ready = () => setOpened((current) => current && { ...current, ready: true });
  // `write`: the reply button, so the post opens with the cursor in its reply field
  const open = (post: Post, write = false) => {
    seedPost(post);
    const card = cardRefs.current.get(post.id);
    const show = (from: Box, pageWidth: number, animate: boolean) => {
      setOpened({ post, write, from, pageWidth, ready: !animate });
      progress.set(0);
      if (!animate) {
        progress.set(1);
        return;
      }
      // The copy grows to the full-width page; then the page itself shows in its place (as tall as the copy, opening out)
      progress.set(
        withTiming(1, { duration: MORPH_MS, easing: MORPH_EASING }, (finished) => {
          if (finished) scheduleOnRN(ready);
        }),
      );
    };
    if (reduced || !card || !pageRef.current) return show({ left: 0, top: 0, width: 0, height: 0 }, 0, false);
    pageRef.current.measureInWindow((px, py, pageWidth) =>
      card.measureInWindow((x, y, width, height) => show({ left: x - px, top: y - py, width, height }, pageWidth, true)),
    );
  };
  // Closing begins: the other posts come back as the card shrinks
  const closing = () => progress.set(withTiming(0, { duration: MORPH_MS, easing: MORPH_EASING }));

  // Android's back (and Escape on the web) closes the open post like the ×; BackHandler does not exist on the web
  useEffect(() => {
    if (!opened) return;
    if (Platform.OS === 'web') {
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') runCloseHandler();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => runCloseHandler());
    return () => back.remove();
  }, [opened]);

  return (
    <View ref={pageRef} collapsable={false} style={styles.page}>
      {/* Behind the posts: the warm paper with the outlined leaves at its edges, drifting as the list scrolls */}
      <BotanicalBackground scrollY={scrollY} decorations={POSTS_DECORATIONS} color={PAGE_COLOR} />
      <TopGradient color={PAGE_COLOR} />
      <TopWash />
      <Animated.View style={[styles.fill, others]}>
      <Animated.FlatList
        onScroll={backgroundScroll}
        scrollEventThrottle={16}
        {...LIST_TUNING}
        style={styles.grayList}
        data={posts}
        keyExtractor={(post) => String(post.id)}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText size="big" bold accessibilityRole="header" style={titleFont}>
              Αναρτήσεις
            </AppText>
            {/* The order: a list opens right below the button */}
            <SortMenu value={sort} onChange={setSort} />
          </View>
        }
        renderItem={({ item }) => {
          const { reaction, likeCount } = reactions.stateOf(item);
          return (
            // Each post a rounded beige card with the plant page tiles' paper grain and shadow
            <View
              ref={(view) => {
                cardRefs.current.set(item.id, view);
              }}
              collapsable={false}
              style={opened?.post.id === item.id && styles.hidden}>
              <PostPaper>
                <DiscussionItem
              author={item.author.name}
              date={timeAgo(item.createdAt)}
              title={item.title}
              plant={item.plant}
              text={item.content}
              textLines={3}
              likeCount={likeCount}
              reaction={reaction}
              onReact={(pressed) => reactions.toggle(item, pressed)}
              replyCount={item.replyCount}
              onPress={() => open(item)}
              onReplies={() => open(item, true)}
              onEdit={item.author.id === me ? () => setEditing(item) : undefined}
              onDelete={item.author.id === me ? () => remove(item) : undefined}
              actionSize={item.images.length > 0 ? 'normal' : 'small'}
              style={styles.post}>
              <PostPhotos images={item.images} label={item.title} compact />
            </DiscussionItem>
              </PostPaper>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          loading || error ? null : (
            <AppText color={colors.inkMuted} style={styles.empty}>
              Γράψε την πρώτη ανάρτηση!
            </AppText>
          )
        }
        ListFooterComponent={
          <>
            {loading && <ActivityIndicator color={colors.primary} style={styles.status} />}
            {error && !loading && (
              <View style={styles.status}>
                <AppText color={colors.inkMuted}>Δεν ήταν δυνατή η φόρτωση των αναρτήσεων.</AppText>
                <PillButton label="Δοκίμασε ξανά" onPress={posts.length ? loadMore : refresh} />
              </View>
            )}
            {reactions.error && (
              <AppText size="small" color={colors.accent} style={styles.status} accessibilityLiveRegion="polite">
                Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.
              </AppText>
            )}
          </>
        }
        // The sort button is as far under the corner buttons as the first card is under it (the clearance already has a small gap)
        contentContainerStyle={[styles.list, { paddingTop: topClearance - space.sm + space.md, paddingBottom: space.md + formHeight }]}
      />
      </Animated.View>
      {/* The same form as the home page's: a field, and on a tap its title, photo and plant buttons.
          The new post goes to the top of the list */}
      {editing && (
        <EditPostSheet
          post={editing}
          onSaved={(saved) => update((current) => current.map((p) => (p.id === saved.id ? saved : p)))}
          onClose={() => setEditing(null)}
        />
      )}
      <BottomBar floating onHeight={setFormHeight}>
        <AskCard composer fieldColor={POST_COLOR} onPosted={(post) => update((current) => [post, ...current])} />
      </BottomBar>

      {/* The open post: a full-screen modal over this page. While the card grows only its background is there, with
          the card's copy over it; then the page itself */}
      {opened && (
        <>
          <PostPage
            modal
            id={opened.post.id}
            write={opened.write}
            origin={opened.from.width > 0 ? opened.from : null}
            pageWidth={opened.pageWidth}
            grow={progress}
            ready={opened.ready}
            onClosing={closing}
            onDeleted={(id) => update((current) => current.filter((p) => p.id !== id))}
            onClose={() => setOpened(null)}
          />
          {!opened.ready && <PostMorph post={opened.post} from={opened.from} top={topClearance} progress={progress} pageWidth={opened.pageWidth} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Warm tan behind the posts: it shows between them (the list itself is see-through, for the gradient)
  page: {
    flex: 1,
  },
  grayList: {
    backgroundColor: 'transparent',
  },
  // Posts keep the side margin, like the title
  list: {
    paddingBottom: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
    paddingHorizontal: space.md,
  },
  // Less room under the actions than around the rest
  post: {
    padding: space.md,
    paddingBottom: space.xs,
  },
  fill: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  // Between two posts: the list's gray shows through
  gap: {
    // 30% less than before (24)
    height: Math.round(space.lg * 0.7),
  },
  empty: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  status: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    textAlign: 'center',
  },
});
