import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { ReplyThread } from '@/components/discussion/reply-thread';
import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { MessageInput } from '@/components/ui/message-input';
import { card } from '@/components/ui/styles';
import { countReplies } from '@/config/community-posts';
import { useCommunity } from '@/lib/community';
import { colors, space } from '@/theme';

/** One community post with its replies, nested like Reddit; any reply can be answered */
export default function CommunityPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { posts, addPost, addReply } = useCommunity();
  // The reply whose "Απάντηση" was tapped (an input opens under it)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <AppText color={colors.inkMuted} style={[styles.notFound, { marginTop: topClearance }]}>
        Η ανάρτηση δεν βρέθηκε.
      </AppText>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: topClearance }]}>
        <View style={styles.card}>
          <DiscussionItem
            author={post.author}
            date={post.date}
            text={post.text}
            likeCount={post.likeCount}
            replyCount={countReplies(post)}
          />
          <MessageInput placeholder="Γράψε απάντηση..." onSend={(text) => addReply(post.id, null, text)} />
        </View>

        {post.replies.length > 0 && (
          <View style={styles.card}>
            <ReplyThread
              replies={post.replies}
              replyingTo={replyingTo}
              onReplyTo={(replyId) => setReplyingTo((current) => (current === replyId ? null : replyId))}
              onSend={(parentId, text) => {
                addReply(post.id, parentId, text);
                setReplyingTo(null);
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* A new post (not a reply): it opens in its own page */}
      <BottomComposer
        placeholder="Η ανάρτησή σου..."
        onSend={(text) => router.replace({ pathname: '/community/[id]', params: { id: addPost(text) } })}
      />
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
    textAlign: 'center',
  },
});
