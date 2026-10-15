import type { PostSort } from '@growme/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { SortMenu } from '@/components/discussion/sort-menu';
import { AskCard } from '@/components/home/ask-card';
import { useTopClearance } from '@/components/layout/app-shell';
import { TopGradient } from '@/components/layout/top-gradient';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { timeAgo } from '@/lib/format';
import { usePosts } from '@/lib/posts';
import { useReactions } from '@/lib/reactions';
import { colors, quietGray, space } from '@/theme';

const openPost = (id: number) => router.push({ pathname: '/community/[id]', params: { id: String(id) } });

/** Users' questions, newest first (more load while scrolling), with a field to write a new one */
export default function CommunityScreen() {
  const topClearance = useTopClearance();
  const [sort, setSort] = useState<PostSort>('newest');
  // The form floats over the list: the list leaves room for it at the end
  const [formHeight, setFormHeight] = useState(0);
  const { posts, loading, error, loadMore, refresh, update } = usePosts(sort);
  const reactions = useReactions('post', posts);

  return (
    <View style={styles.page}>
      {/* Behind the posts: it shows through the gray list's gaps and header */}
      <TopGradient />
      <FlatList
        style={styles.grayList}
        data={posts}
        keyExtractor={(post) => String(post.id)}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText size="big" bold accessibilityRole="header">
              Αναρτήσεις
            </AppText>
            {/* The order: a list opens right below the button */}
            <SortMenu value={sort} onChange={setSort} />
          </View>
        }
        renderItem={({ item }) => {
          const { reaction, likeCount } = reactions.stateOf(item);
          return (
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
              onPress={() => openPost(item.id)}
              actionSize={item.images.length > 0 ? 'normal' : 'small'}
              style={styles.post}>
              <PostPhotos images={item.images} label={item.title} compact />
            </DiscussionItem>
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
        contentContainerStyle={[styles.list, { paddingTop: topClearance, paddingBottom: space.md + formHeight }]}
      />
      {/* The same form as the home page's: a field, and on a tap its title, photo and plant buttons.
          The new post goes to the top of the list */}
      <BottomBar floating onHeight={setFormHeight}>
        <AskCard composer onPosted={(post) => update((current) => [post, ...current])} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  // Gray behind the posts: it shows between them (the list itself is see-through, for the gradient)
  page: {
    flex: 1,
    backgroundColor: quietGray,
  },
  grayList: {
    backgroundColor: 'transparent',
  },
  // Posts run the screen's full width; only the title keeps the side margin
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
    backgroundColor: colors.surface,
  },
  // Between two posts: the list's gray shows through, so each post is its own white block
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
