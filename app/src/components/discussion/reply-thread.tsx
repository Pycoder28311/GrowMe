import type { PostReply } from '@growme/shared';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { postRepliesApi } from '@/api/posts';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { AppText } from '@/components/ui/app-text';
import { MessageInput } from '@/components/ui/message-input';
import { PillButton } from '@/components/ui/pill-button';
import { timeAgo } from '@/lib/format';
import { useReplies } from '@/lib/posts';
import { useReactions, type Reaction } from '@/lib/reactions';
import { colors, space } from '@/theme';

// Deeper replies stop indenting further, so text never gets too narrow on a phone
const MAX_INDENT_DEPTH = 3;

type LevelProps = {
  postId: number;
  /** null = the post's own replies */
  parentReplyId: number | null;
  depth?: number;
  /** Replies written on this screen, shown first (they may not be in the loaded page yet) */
  added?: PostReply[];
  /** A reply was written anywhere below (the post's count goes up) */
  onReplied: () => void;
};

/** One reply: its actions, an answer box after «Απάντηση», and its answers after «Απαντήσεις (n)» */
function ReplyNode(props: {
  postId: number;
  reply: PostReply;
  depth: number;
  reaction: Reaction;
  likeCount: number;
  onReact: (pressed: Exclude<Reaction, null>) => void;
  onReplied: () => void;
}) {
  const { postId, reply, depth } = props;
  const [open, setOpen] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [answers, setAnswers] = useState<PostReply[]>([]);
  const [error, setError] = useState(false);

  const answer = async (text: string) => {
    setError(false);
    try {
      const created = await postRepliesApi.create(postId, reply.id, text);
      setAnswers((current) => [created, ...current]);
      setAnswering(false);
      setOpen(true);
      props.onReplied();
    } catch {
      setError(true);
    }
  };

  return (
    <View style={[depth > 0 && styles.nested, depth > MAX_INDENT_DEPTH && styles.flat]}>
      <DiscussionItem
        author={reply.author.name}
        date={timeAgo(reply.createdAt)}
        text={reply.content}
        likeCount={props.likeCount}
        reaction={props.reaction}
        onReact={props.onReact}
        replyCount={reply.replyCount + answers.length}
        repliesOpen={open}
        onToggleReplies={() => setOpen((v) => !v)}
        onReply={() => setAnswering((v) => !v)}
        style={styles.item}
      />
      {answering && (
        <View style={styles.input}>
          <MessageInput placeholder={`Απάντηση στον/στην ${reply.author.name}...`} autoFocus onSend={answer} />
          {error && (
            <AppText size="small" color={colors.accent}>
              Η απάντηση δεν στάλθηκε. Δοκίμασε ξανά.
            </AppText>
          )}
        </View>
      )}
      {open && (
        <ReplyLevel postId={postId} parentReplyId={reply.id} depth={depth + 1} added={answers} onReplied={props.onReplied} />
      )}
    </View>
  );
}

/**
 * One level of a post's replies (the post's own, or the answers to one reply), loaded from the API a
 * page at a time, nested like Reddit: each reply can open its own answers below it.
 */
export function ReplyLevel({ postId, parentReplyId, depth = 0, added = [], onReplied }: LevelProps) {
  const { replies, loading, error, hasMore, loadMore, refresh } = useReplies(postId, parentReplyId);
  const shown = [...added.filter((a) => !replies.some((r) => r.id === a.id)), ...replies];
  const reactions = useReactions('post_reply', shown);

  return (
    <View>
      {shown.map((reply, index) => {
        const { reaction, likeCount } = reactions.stateOf(reply);
        return (
          <View key={reply.id} style={depth === 0 && index > 0 && styles.divider}>
            <ReplyNode
              postId={postId}
              reply={reply}
              depth={depth}
              reaction={reaction}
              likeCount={likeCount}
              onReact={(pressed) => reactions.toggle(reply, pressed)}
              onReplied={onReplied}
            />
          </View>
        );
      })}
      {loading && <ActivityIndicator color={colors.primary} style={styles.status} />}
      {error && !loading && (
        <View style={styles.status}>
          <AppText size="small" color={colors.inkMuted}>
            Δεν ήταν δυνατή η φόρτωση των απαντήσεων.
          </AppText>
          <PillButton label="Δοκίμασε ξανά" onPress={shown.length ? loadMore : refresh} />
        </View>
      )}
      {hasMore && !loading && !error && (
        <View style={styles.status}>
          <PillButton label="Περισσότερες απαντήσεις" onPress={loadMore} />
        </View>
      )}
      {reactions.error && (
        <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
          Η αντίδρασή σου δεν αποθηκεύτηκε. Δοκίμασε ξανά.
        </AppText>
      )}
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
    gap: space.xs,
    paddingBottom: space.sm,
  },
  status: {
    alignItems: 'flex-start',
    gap: space.xs,
    paddingVertical: space.sm,
  },
});
