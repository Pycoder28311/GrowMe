import type { BlogComment } from '@growme/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReplyLevel } from '@/components/discussion/reply-thread';
import { AppText } from '@/components/ui/app-text';
import { MessageInput } from '@/components/ui/message-input';
import { useCommentThread } from '@/lib/blogs';
import { colors, space } from '@/theme';

/**
 * An article's comments from the API, nested like the community's replies: likes / dislikes, and
 * any comment can be answered and opens its own answers.
 */
export function CommentsSection({ blogId, commentCount }: { blogId: number; commentCount: number }) {
  const thread = useCommentThread(blogId);
  // Comments written on this page to the article itself (shown first)
  const [added, setAdded] = useState<BlogComment[]>([]);
  const [error, setError] = useState(false);

  const comment = async (text: string) => {
    setError(false);
    try {
      const created = await thread.create(null, text);
      setAdded((current) => [created, ...current]);
    } catch {
      setError(true);
    }
  };

  return (
    <View style={styles.root}>
      <MessageInput placeholder="Γράψε σχόλιο..." onSend={comment} />
      {error && (
        <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
          {thread.words.sendError}
        </AppText>
      )}
      <ReplyLevel source={thread} parentId={null} added={added} onReplied={() => {}} />
      {commentCount === 0 && added.length === 0 && (
        <AppText color={colors.inkMuted}>Γράψε το πρώτο σχόλιο!</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
});
