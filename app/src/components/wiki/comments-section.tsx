import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DiscussionItem } from '@/components/discussion/discussion-item';
import { MessageInput } from '@/components/ui/message-input';
import { EXAMPLE_COMMENTS, type PostComment } from '@/config/post-comments';
import { authClient } from '@/lib/auth-client';
import { colors, space } from '@/theme';

/** Write a comment and read the others. New comments stay on this screen only (not saved yet). */
export function CommentsSection() {
  const { data: session } = authClient.useSession();
  const [comments, setComments] = useState<PostComment[]>(EXAMPLE_COMMENTS);

  const add = (text: string) =>
    setComments((current) => [
      {
        id: `new-${current.length}`,
        author: session?.user.name || 'Εσύ',
        date: 'Μόλις τώρα',
        text,
        replyCount: 0,
        likeCount: 0,
      },
      ...current,
    ]);

  return (
    <View style={styles.root}>
      <MessageInput placeholder="Γράψε σχόλιο..." onSend={add} />
      <View>
        {comments.map((comment) => (
          <DiscussionItem
            key={comment.id}
            author={comment.author}
            date={comment.date}
            text={comment.text}
            likeCount={comment.likeCount}
            replyCount={comment.replyCount}
            style={styles.comment}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  comment: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: space.sm,
  },
});
