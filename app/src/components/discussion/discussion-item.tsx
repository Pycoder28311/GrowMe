import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, iconSize, radius, size, space } from '@/theme';

const AVATAR = size.touch / 1.5;

type Reaction = 'like' | 'dislike' | null;

type DiscussionItemProps = {
  author: string;
  /** e.g. "2 ημέρες πριν" */
  date: string;
  text: string;
  likeCount: number;
  /** Shows "Απαντήσεις (n)" */
  replyCount?: number;
  /** Shows an "Απάντηση" button */
  onReply?: () => void;
  /** Makes the whole item tappable (e.g. open the post) */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function ItemAction({ children, label, onPress, selected }: { children: ReactNode; label?: string; onPress?: () => void; selected?: boolean }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={styles.action}>
      {children}
    </PressableScale>
  );
}

function ReactionButton({ icon, label, active, count, onPress }: { icon: IconName; label: string; active: boolean; count?: number; onPress: () => void }) {
  const color = active ? colors.primary : colors.inkMuted;
  return (
    <ItemAction label={label} selected={active} onPress={onPress}>
      <Icon name={icon} size={iconSize.small} color={color} bold={active} />
      {count !== undefined && (
        <AppText size="small" bold={active} color={color}>
          {count}
        </AppText>
      )}
    </ItemAction>
  );
}

/**
 * One message in a discussion (a post, comment or reply): avatar, author, date, text, and
 * replies / reply / like / dislike. Reactions are local for now.
 */
export function DiscussionItem({ author, date, text, likeCount, replyCount, onReply, onPress, style }: DiscussionItemProps) {
  const [reaction, setReaction] = useState<Reaction>(null);
  const toggle = (next: Exclude<Reaction, null>) => setReaction((current) => (current === next ? null : next));
  const likes = likeCount + (reaction === 'like' ? 1 : 0);

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText size="small" bold color={colors.primary}>
            {author.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <AppText bold>{author}</AppText>
        <AppText size="small" color={colors.inkMuted}>
          {date}
        </AppText>
      </View>

      <AppText>{text}</AppText>

      <View style={styles.actions}>
        {replyCount !== undefined && (
          <ItemAction onPress={onPress}>
            <AppText size="small" bold color={colors.primary}>
              Απαντήσεις{replyCount > 0 ? ` (${replyCount})` : ''}
            </AppText>
          </ItemAction>
        )}
        {onReply && (
          <ItemAction onPress={onReply}>
            <AppText size="small" bold color={colors.primary}>
              Απάντηση
            </AppText>
          </ItemAction>
        )}
        <ReactionButton icon="like" label="Μου αρέσει" active={reaction === 'like'} count={likes} onPress={() => toggle('like')} />
        <ReactionButton icon="dislike" label="Δεν μου αρέσει" active={reaction === 'dislike'} onPress={() => toggle('dislike')} />
      </View>
    </>
  );

  return onPress ? (
    <PressableScale accessibilityRole="link" onPress={onPress} pressedScale={0.98} style={[styles.item, style]}>
      {content}
    </PressableScale>
  ) : (
    <View style={[styles.item, style]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: space.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: space.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
  },
});
