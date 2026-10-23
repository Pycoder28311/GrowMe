import type { PostPlant } from '@growme/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { PostMenu } from '@/components/discussion/post-menu';
import { PlantBadge } from '@/components/plants/plant-badge';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { Reaction } from '@/lib/reactions';
import { alpha, botanical, colors, fontFamily, fontSize, iconSize, radius, size, space, titleFont } from '@/theme';

const AVATAR = size.touch / 1.5;
/** The title of a post: a little smaller in its card than on its page */
const CARD_TITLE = { fontSize: 22, lineHeight: 28 } as const;
const PAGE_TITLE = { fontSize: 26, lineHeight: 32 } as const;
/** The avatar row sits this much nearer the card's top, left and right edges than the rest (30% less than the usual padding) */
const HEADER_PULL = space.md - Math.round(space.md * 0.7);

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
  /** The author's «Επεξεργασία» and «Διαγραφή» in the three dots menu at the top right (only the author's own posts pass them) */
  onEdit?: () => void;
  onDelete?: () => void;
  /** The «Απάντησε» / «Απαντήσεις» button when it opens something else than `onPress` (the post's page, ready to write a reply) */
  onReplies?: () => void;
  /** Makes the whole item tappable (e.g. open the post) */
  onPress?: () => void;
  /** The actions' size: `normal` on a post with photos (they scale with it), else `small` */
  actionSize?: 'small' | 'normal';
  /** A post's own page: a bigger title, and the title and text set a little further in from the left */
  roomy?: boolean;
  /** A card turning into a post's page (and back): 0 is the list's look, 1 the `roomy` one; the title's size and the words' inset follow it smoothly */
  morph?: SharedValue<number>;
  /** In a box taller than the item needs (a post's page): the actions go to the bottom of it */
  pinActions?: boolean;
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
  onReplies,
  onEdit,
  onDelete,
  onPress,
  actionSize = 'small',
  roomy = false,
  morph,
  pinActions = false,
  style,
}: DiscussionItemProps) {
  const idle = useSharedValue(0);
  const turn = morph ?? idle;
  // The title grows to the page's size and, with the words, moves in from the left as the card turns into the page
  const titleMorph = useAnimatedStyle(() => ({
    fontSize: interpolate(turn.get(), [0, 1], [CARD_TITLE.fontSize, PAGE_TITLE.fontSize]),
    lineHeight: interpolate(turn.get(), [0, 1], [CARD_TITLE.lineHeight, PAGE_TITLE.lineHeight]),
    paddingLeft: turn.get() * space.sm,
  }));
  const textMorph = useAnimatedStyle(() => ({ paddingLeft: turn.get() * space.sm }));
  // On the post's page the avatar row starts where the title and the words do (the list's card pulls it nearer the edge)
  const headerMorph = useAnimatedStyle(() => ({ marginLeft: interpolate(turn.get(), [0, 1], [-HEADER_PULL, space.sm]) }));
  const content = (
    <>
      <Animated.View style={[styles.header, roomy && styles.headerInset, morph && headerMorph]}>
        <View style={styles.who}>
          <View style={styles.avatar}>
            <AppText size="small" bold color={colors.primary}>
              {author.charAt(0).toUpperCase()}
            </AppText>
          </View>
          <AppText bold numberOfLines={1} style={styles.author}>
            {author}
          </AppText>
          {date && (
            <AppText size="small" color={colors.inkMuted}>
              {date}
            </AppText>
          )}
        </View>
        {/* The plant the post is about, at the top right */}
        {plant && (
          <View style={styles.plant}>
            <PlantBadge
              lifted
              plant={plant}
              onPress={() => router.push({ pathname: '/plants/[id]', params: { id: String(plant.id) } })}
            />
          </View>
        )}
        {(onEdit || onDelete) && <PostMenu onEdit={onEdit} onDelete={onDelete} />}
      </Animated.View>

      {title !== undefined &&
        (morph ? (
          <Animated.Text style={[{ fontFamily: fontFamily.bold, color: colors.ink }, titleFont, styles.title, titleMorph]}>
            {title}
          </Animated.Text>
        ) : (
          <AppText bold style={[titleFont, styles.title, roomy && styles.pageTitle, roomy && styles.inset]}>
            {title}
          </AppText>
        ))}
      {morph ? (
        <Animated.Text numberOfLines={textLines} style={[{ fontFamily: fontFamily.normal, fontSize: fontSize.normal, color: colors.ink }, textMorph]}>
          {text}
        </Animated.Text>
      ) : (
        <AppText numberOfLines={textLines} style={roomy && styles.inset}>
          {text}
        </AppText>
      )}
      {children}

      <View style={[styles.actions, pinActions && styles.pinned]}>
        {replyCount !== undefined && (onToggleReplies === undefined || replyCount > 0) && (
          <ItemAction
            label={onToggleReplies && (repliesOpen ? 'Απόκρυψη απαντήσεων' : 'Εμφάνιση απαντήσεων')}
            selected={onToggleReplies ? !!repliesOpen : undefined}
            onPress={onToggleReplies ?? onReplies ?? onPress}>
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
  // One gap between the header, the title, the words, the photos and the actions: the title is as far from the
  // avatar row as from the text (4px)
  item: {
    gap: space.xs,
  },
  // The avatar row (and the plant pill at its end) nearer the card's top, left and right edges; the title follows it by the same small gap
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: -HEADER_PULL,
    marginLeft: -HEADER_PULL,
    marginRight: -HEADER_PULL,
  },
  // On the post's page: in line with the title and the words
  headerInset: {
    marginLeft: space.sm,
  },
  who: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  author: {
    flexShrink: 1,
  },
  plant: {
    flexShrink: 1,
    maxWidth: '45%',
  },
  // The serif has no bold weight of its own here: ask for it
  title: {
    fontWeight: '700',
    ...CARD_TITLE,
  },
  pageTitle: PAGE_TITLE,
  inset: {
    paddingLeft: space.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    // Lifted off the card a little
    boxShadow: `0 2px 6px ${alpha(botanical.ink, 0.25)}`,
  },
  // The rest of a taller box goes above them
  pinned: {
    marginTop: 'auto',
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
