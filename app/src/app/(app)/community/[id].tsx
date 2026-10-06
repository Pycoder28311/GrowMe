import type { PostReply } from '@growme/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { postRepliesApi, postsApi } from '@/api/posts';
import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { PostPhotos } from '@/components/discussion/post-photos';
import { ReplyLevel } from '@/components/discussion/reply-thread';
import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { MessageInput } from '@/components/ui/message-input';
import { PillButton } from '@/components/ui/pill-button';
import { card } from '@/components/ui/styles';
import { timeAgo } from '@/lib/format';
import { firstSentence, usePost } from '@/lib/posts';
import { useReactions } from '@/lib/reactions';
import { colors, space } from '@/theme';

/** One community post with its replies, nested like Reddit; any reply can be answered */
export default function CommunityPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { post, state, retry, update } = usePost(Number(id));
  const reactions = useReactions('post', post ? [post] : []);
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

  // A new post (not a reply): it opens in its own page
  const newPost = async (text: string) => {
    setError(null);
    try {
      const created = await postsApi.create({ title: firstSentence(text), content: text, imageIds: [] });
      router.replace({ pathname: '/community/[id]', params: { id: String(created.id) } });
    } catch {
      setError('Η ανάρτηση δεν στάλθηκε. Δοκίμασε ξανά.');
    }
  };

  const { reaction, likeCount } = reactions.stateOf(post);

  return (
    <View style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: topClearance }]}>
        <View style={styles.card}>
          <DiscussionItem
            author={post.author.name}
            date={timeAgo(post.createdAt)}
            title={post.title}
            text={post.content}
            likeCount={likeCount}
            reaction={reaction}
            onReact={(pressed) => reactions.toggle(post, pressed)}
            replyCount={post.replyCount}>
            <PostPhotos images={post.images} label={post.title} />
          </DiscussionItem>
          <MessageInput placeholder="Γράψε απάντηση..." onSend={reply} />
          {(error || reactions.error) && (
            <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
              {error ?? 'Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.'}
            </AppText>
          )}
        </View>

        <View style={styles.card}>
          <ReplyLevel postId={post.id} parentReplyId={null} added={added} onReplied={countReply} />
          {post.replyCount === 0 && added.length === 0 && (
            <AppText color={colors.inkMuted}>Γράψε την πρώτη απάντηση!</AppText>
          )}
        </View>
      </ScrollView>

      <BottomComposer placeholder="Η ανάρτησή σου..." onSend={newPost} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
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
