import type { Author, LikedType, Page } from '@growme/shared';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DiscussionItem } from '@/components/discussion/discussion-item';
import { AppText } from '@/components/ui/app-text';
import { MessageInput } from '@/components/ui/message-input';
import { PillButton } from '@/components/ui/pill-button';
import { useReactions, type Reaction } from '@/lib/reactions';
import { usePagedList } from '@/lib/use-api';
import { colors, space } from '@/theme';

// Deeper replies stop indenting further, so text never gets too narrow on a phone
const MAX_INDENT_DEPTH = 3;

/** What a tree shows of each reply: post replies and blog comments both have this shape */
export type ThreadItem = {
  id: number;
  content: string;
  author: Author;
  likeCount: number;
  /** Direct answers */
  replyCount: number;
  createdAt: string;
};

/**
 * Where a tree's replies come from (one post's replies, one blog's comments). parentId null = the
 * top level. Keep it stable (useMemo): a new object reloads every level.
 */
export type ThreadSource<T extends ThreadItem> = {
  likedType: LikedType;
  list: (parentId: number | null, cursor: string | null) => Promise<Page<T>>;
  create: (parentId: number | null, content: string) => Promise<T>;
  /** The texts that differ between replies and comments */
  words: { loadError: string; sendError: string; more: string };
};

type LevelProps<T extends ThreadItem> = {
  source: ThreadSource<T>;
  /** null = the top level */
  parentId: number | null;
  depth?: number;
  /** Replies written on this screen, shown first (they may not be in the loaded page yet) */
  added?: T[];
  /** A reply was written anywhere below (the parent's count goes up) */
  onReplied: () => void;
};

/** One reply: its actions, an answer box after «Απάντηση», and its answers after «Απαντήσεις (n)» */
function ReplyNode<T extends ThreadItem>(props: {
  source: ThreadSource<T>;
  reply: T;
  depth: number;
  reaction: Reaction;
  likeCount: number;
  onReact: (pressed: Exclude<Reaction, null>) => void;
  onReplied: () => void;
}) {
  const { source, reply, depth } = props;
  const [open, setOpen] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [answers, setAnswers] = useState<T[]>([]);
  const [error, setError] = useState(false);

  const answer = async (text: string) => {
    setError(false);
    try {
      const created = await source.create(reply.id, text);
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
              {source.words.sendError}
            </AppText>
          )}
        </View>
      )}
      {open && (
        <ReplyLevel source={source} parentId={reply.id} depth={depth + 1} added={answers} onReplied={props.onReplied} />
      )}
    </View>
  );
}

/**
 * One level of a reply tree (the top level, or the answers to one reply), loaded from the API a page
 * at a time, nested like Reddit: each reply can open its own answers below it. Used for post replies
 * and blog comments.
 */
export function ReplyLevel<T extends ThreadItem>({ source, parentId, depth = 0, added = [], onReplied }: LevelProps<T>) {
  const fetchPage = useCallback((cursor: string | null) => source.list(parentId, cursor), [source, parentId]);
  const { items: replies, loading, error, hasMore, loadMore, refresh } = usePagedList(fetchPage);
  const shown = [...added.filter((a) => !replies.some((r) => r.id === a.id)), ...replies];
  const reactions = useReactions(source.likedType, shown);

  return (
    <View>
      {shown.map((reply, index) => {
        const { reaction, likeCount } = reactions.stateOf(reply);
        return (
          <View key={reply.id} style={depth === 0 && index > 0 && styles.divider}>
            <ReplyNode
              source={source}
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
            {source.words.loadError}
          </AppText>
          <PillButton label="Δοκίμασε ξανά" onPress={shown.length ? loadMore : refresh} />
        </View>
      )}
      {hasMore && !loading && !error && (
        <View style={styles.status}>
          <PillButton label={source.words.more} onPress={loadMore} />
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
