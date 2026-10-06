import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { postsApi } from '@/api/posts';
import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { card } from '@/components/ui/styles';
import { timeAgo } from '@/lib/format';
import { firstSentence, usePosts } from '@/lib/posts';
import { useReactions } from '@/lib/reactions';
import { colors, space } from '@/theme';

const openPost = (id: number) => router.push({ pathname: '/community/[id]', params: { id: String(id) } });

/** Users' questions, newest first (more load while scrolling), with a field to write a new one */
export default function CommunityScreen() {
  const topClearance = useTopClearance();
  const { posts, loading, error, loadMore, refresh, update } = usePosts();
  const reactions = useReactions('post', posts);
  const [sendError, setSendError] = useState(false);

  // A text-only post: its title is the first sentence
  const send = async (text: string) => {
    setSendError(false);
    try {
      const post = await postsApi.create({ title: firstSentence(text), content: text, imageIds: [] });
      update((current) => [post, ...current]);
    } catch {
      setSendError(true);
    }
  };

  return (
    <View style={styles.page}>
      <FlatList
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
          </View>
        }
        renderItem={({ item }) => {
          const { reaction, likeCount } = reactions.stateOf(item);
          return (
            <DiscussionItem
              author={item.author.name}
              date={timeAgo(item.createdAt)}
              title={item.title}
              text={item.content}
              textLines={3}
              likeCount={likeCount}
              reaction={reaction}
              onReact={(pressed) => reactions.toggle(item, pressed)}
              replyCount={item.replyCount}
              onPress={() => openPost(item.id)}
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
            {(reactions.error || sendError) && (
              <AppText size="small" color={colors.accent} style={styles.status} accessibilityLiveRegion="polite">
                {sendError ? 'Η ανάρτηση δεν στάλθηκε. Δοκίμασε ξανά.' : 'Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.'}
              </AppText>
            )}
          </>
        }
        contentContainerStyle={[styles.list, { paddingTop: topClearance }]}
      />
      {/* The new post goes to the top of the list */}
      <BottomComposer placeholder="Η ανάρτησή σου..." onSend={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  post: {
    ...card,
    padding: space.md,
  },
  gap: {
    height: space.sm,
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
