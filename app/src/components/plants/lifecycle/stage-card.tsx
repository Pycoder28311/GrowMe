import type { Lifecycle } from '@growme/shared';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { LinkedText } from '@/components/ui/linked-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import type { Rect } from '@/config/search-motion';
import { colors, iconSize, space } from '@/theme';

import { firstLine } from './stage-groups';

const TEASE_MS = 400;

type StageCardProps = {
  stage: Lifecycle;
  /** compact: title, the teaser line and «Δες περισσότερα»; full: the whole text */
  mode: 'compact' | 'full';
  /** Compact: show the text's first line (the teaser) */
  teased?: boolean;
  /** Compact: «Δες περισσότερα», with where the card is on screen (the full page grows from it) */
  onOpen?: (rect: Rect) => void;
};

/** One stage of a life cycle as a card: sand for seed stages, white for the plant's own */
export function StageCard({ stage, mode, teased = false, onOpen }: StageCardProps) {
  const ref = useRef<View>(null);
  const line = mode === 'compact' && teased ? firstLine(stage.content) : '';

  const open = () =>
    ref.current?.measureInWindow((left, top, width, height) => onOpen?.({ left, top, width, height }));

  return (
    <Animated.View
      ref={ref}
      collapsable={false}
      layout={LinearTransition.duration(TEASE_MS)}
      style={[styles.card, stage.seed && styles.seed]}>
      <AppText bold>{stage.title}</AppText>
      {mode === 'full' ? (
        <LinkedText>{stage.content}</LinkedText>
      ) : (
        <>
          {line !== '' && (
            <Animated.View entering={FadeIn.duration(TEASE_MS)} exiting={FadeOut.duration(TEASE_MS)}>
              <AppText size="small" color={colors.inkMuted} numberOfLines={1}>
                {line}
              </AppText>
            </Animated.View>
          )}
          {onOpen && (
            <PressableScale
              accessibilityRole="link"
              accessibilityLabel={`${stage.title}: δες περισσότερα`}
              onPress={open}
              pressedScale={0.97}
              hitSlop={space.sm}
              style={styles.more}>
              <AppText size="small" bold color={colors.primary}>
                Δες περισσότερα
              </AppText>
              <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
            </PressableScale>
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  seed: {
    backgroundColor: colors.seedSoft,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
  },
});
