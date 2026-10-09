import type { PostReply } from '@growme/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { postRepliesApi } from '@/api/posts';
import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { ReplyLevel } from '@/components/discussion/reply-thread';
import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { timeAgo } from '@/lib/format';
import { usePost, usePostThread } from '@/lib/posts';
import { useReactions } from '@/lib/reactions';
import { colors, quietGray, space } from '@/theme';

/** One community post: it slides up from the bottom over the list and back down when closed */
export default function CommunityPostScreen() {
  return (
    <>
      <Stack.Screen options={{ animation: 'slide_from_bottom' }} />
      <CommunityPost />
    </>
  );
}

/** One community post with its replies, nested like Reddit; any reply can be answered */
function CommunityPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { post, state, retry, update } = usePost(Number(id));
  const reactions = useReactions('post', post ? [post] : []);
  const thread = usePostThread(Number(id));
  // Replies written on this page to the post itself (shown first)
  const [added, setAdded] = useState<PostReply[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (state === 'loading') return <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />;
  if (state === 'error' || !post) {
    return (
      <View style={[styles.notFound, { marginTop: topClearance }]}>
        <AppText color={colors.inkMuted} style={styles.center}>
          Η ανάρτηση δεν βρέθηκε ή δεν ήταν δυνατή η φόρτωσή της.
        </AppText>
        <PillButton label="Δοκίμασε ξανά" onPress={retry} />
      </View>
    );
  }

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
    <View style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: topClearance }]}>
        <View style={styles.block}>
          <DiscussionItem
            author={post.author.name}
            date={timeAgo(post.createdAt)}
            title={post.title}
            text={post.content}
            likeCount={likeCount}
            reaction={reaction}
            onReact={(pressed) => reactions.toggle(post, pressed)}
            replyCount={post.replyCount}
            actionSize={post.images.length > 0 ? 'normal' : 'small'}>
            <PostPhotos images={post.images} label={post.title} />
          </DiscussionItem>
          {(error || reactions.error) && (
            <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
              {error ?? 'Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.'}
            </AppText>
          )}
        </View>

        {/* A gray gap between the post and its replies */}
        <View style={styles.gap} />

        <View style={styles.block}>
          <ReplyLevel source={thread} parentId={null} added={added} onReplied={countReply} />
          {post.replyCount === 0 && added.length === 0 && (
            <AppText color={colors.inkMuted}>Γράψε την πρώτη απάντηση!</AppText>
          )}
        </View>
      </ScrollView>

      {/* The bottom field answers this post */}
      <BottomComposer placeholder="Γράψε απάντηση..." onSend={reply} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  // Full width: the post and the replies are white bands across the screen
  content: {
    paddingBottom: space.md,
  },
  block: {
    gap: space.sm,
    padding: space.md,
    backgroundColor: colors.surface,
  },
  gap: {
    height: 12,
    backgroundColor: quietGray,
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
