import type { PostPlant } from '@growme/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PlantBadge } from '@/components/plants/plant-badge';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { Reaction } from '@/lib/reactions';
import { colors, iconSize, radius, size, space } from '@/theme';

const AVATAR = size.touch / 1.5;

type DiscussionItemProps = {
  author: string;
  /** e.g. "2 ημέρες πριν"; replies show none */
  date?: string;
  /** Bold line above the text (posts) */
  title?: string;
  /** The plant the post is about: a small link to it above the title */
  plant?: PostPlant | null;
  text: string;
  /** Shows only the first lines of the text (lists) */
  textLines?: number;
  /** Shown under the text (e.g. the post's photos) */
  children?: ReactNode;
  likeCount: number;
  /** My reaction (the screen keeps it and saves it through the API: useReactions) */
  reaction: Reaction;
  onReact: (pressed: Exclude<Reaction, null>) => void;
  /** Shows "Απαντήσεις (n)" */
  replyCount?: number;
  /** "Απαντήσεις (n)" opens/closes the answers in place instead of `onPress` */
  onToggleReplies?: () => void;
  repliesOpen?: boolean;
  /** Shows an "Απάντηση" button */
  onReply?: () => void;
  /** Makes the whole item tappable (e.g. open the post) */
  onPress?: () => void;
  /** The actions' size: `normal` on a post with photos (they scale with it), else `small` */
  actionSize?: 'small' | 'normal';
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

type ActionSize = 'small' | 'normal';

function ReactionButton({ icon, label, active, count, onPress, size: actionSize }: { icon: IconName; label: string; active: boolean; count?: number; onPress: () => void; size: ActionSize }) {
  const color = active ? colors.primary : colors.inkMuted;
  return (
    <ItemAction label={label} selected={active} onPress={onPress}>
      <Icon name={icon} size={actionSize === 'normal' ? iconSize.big : iconSize.normal} color={color} bold={active} />
      {count !== undefined && (
        <AppText bold={active} color={color}>
          {count}
        </AppText>
      )}
    </ItemAction>
  );
}

/**
 * One message in a discussion (a post, comment or reply): avatar, author, date, title, text, and
 * replies / reply / like / dislike.
 */
export function DiscussionItem({
  author,
  date,
  title,
  plant,
  text,
  textLines,
  children,
  likeCount,
  reaction,
  onReact,
  replyCount,
  onToggleReplies,
  repliesOpen,
  onReply,
  onPress,
  actionSize = 'small',
  style,
}: DiscussionItemProps) {
  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText size="small" bold color={colors.primary}>
            {author.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <AppText bold>{author}</AppText>
        {date && (
          <AppText size="small" color={colors.inkMuted}>
            {date}
          </AppText>
        )}
      </View>

      {plant && (
        <PlantBadge
          plant={plant}
          onPress={() => router.push({ pathname: '/plants/[id]', params: { id: String(plant.id) } })}
        />
      )}
      {title !== undefined && <AppText bold>{title}</AppText>}
      <AppText numberOfLines={textLines}>{text}</AppText>
      {children}

      <View style={styles.actions}>
        {replyCount !== undefined && (onToggleReplies === undefined || replyCount > 0) && (
          <ItemAction
            label={onToggleReplies && (repliesOpen ? 'Απόκρυψη απαντήσεων' : 'Εμφάνιση απαντήσεων')}
            selected={onToggleReplies ? !!repliesOpen : undefined}
            onPress={onToggleReplies ?? onPress}>
            <AppText bold color={colors.primary}>
              {/* No replies yet: an invitation to be the first */}
              {onToggleReplies && repliesOpen ? 'Απόκρυψη' : replyCount === 0 ? 'Απάντησε' : 'Απαντήσεις'}
              {replyCount > 0 ? ` (${replyCount})` : ''}
            </AppText>
          </ItemAction>
        )}
        {onReply && (
          <ItemAction onPress={onReply}>
            <AppText bold color={colors.primary}>
              Απάντηση
            </AppText>
          </ItemAction>
        )}
        <ReactionButton icon="like" label="Μου αρέσει" active={reaction === 'like'} count={likeCount} onPress={() => onReact('like')} size={actionSize} />
        <ReactionButton icon="dislike" label="Δεν μου αρέσει" active={reaction === 'dislike'} onPress={() => onReact('dislike')} size={actionSize} />
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
