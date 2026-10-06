import { StyleSheet, View } from 'react-native';

import { DiscussionItem } from '@/components/discussion/discussion-item';
import { MessageInput } from '@/components/ui/message-input';
import type { Reply } from '@/config/community-posts';
import { colors, space } from '@/theme';

// Deeper replies stop indenting further, so text never gets too narrow on a phone
const MAX_INDENT_DEPTH = 3;

type ReplyThreadProps = {
  replies: Reply[];
  /** The reply whose "Απάντηση" was tapped: an input opens under it */
  replyingTo: string | null;
  onReplyTo: (replyId: string) => void;
  onSend: (parentId: string, text: string) => void;
  depth?: number;
};

/** Replies with their own answers nested under them (indented with a line on the left, like Reddit) */
export function ReplyThread({ replies, replyingTo, onReplyTo, onSend, depth = 0 }: ReplyThreadProps) {
  return (
    <View>
      {replies.map((reply, index) => (
        <View
          key={reply.id}
          style={[
            depth === 0 && index > 0 && styles.divider,
            depth > 0 && styles.nested,
            depth > MAX_INDENT_DEPTH && styles.flat,
          ]}>
          <DiscussionItem
            author={reply.author}
            date={reply.date}
            text={reply.text}
            likeCount={reply.likeCount}
            onReply={() => onReplyTo(reply.id)}
            style={styles.item}
          />
          {replyingTo === reply.id && (
            <View style={styles.input}>
              <MessageInput placeholder="Γράψε απάντηση..." autoFocus onSend={(text) => onSend(reply.id, text)} />
            </View>
          )}
          {reply.replies.length > 0 && (
            <ReplyThread
              replies={reply.replies}
              replyingTo={replyingTo}
              onReplyTo={onReplyTo}
              onSend={onSend}
              depth={depth + 1}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: space.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nested: {
    marginLeft: space.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: space.sm,
  },
  flat: {
    marginLeft: 0,
  },
  input: {
    paddingBottom: space.sm,
  },
});
