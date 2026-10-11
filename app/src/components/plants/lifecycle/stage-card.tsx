import type { Lifecycle } from '@growme/shared';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { LinkedText } from '@/components/ui/linked-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import type { Rect } from '@/config/search-motion';
import { colors, radius, space } from '@/theme';

import { firstLine } from './stage-groups';

const TEASE_MS = 400;

type StageCardProps = {
  stage: Lifecycle;
  /** compact: title and the teaser line (a tap opens the full life cycle); full: the whole text */
  mode: 'compact' | 'full';
  /** Compact: show the text's first line (the teaser) */
  teased?: boolean;
  /** Compact: a tap on the card, with where it is on screen (the full page grows from it) */
  onOpen?: (rect: Rect) => void;
};

/** One stage of a life cycle as a card: sand for seed stages, white for the plant's own */
export function StageCard({ stage, mode, teased = false, onOpen }: StageCardProps) {
  const ref = useRef<View>(null);
  const line = mode === 'compact' && teased ? firstLine(stage.content) : '';

  const open = () =>
    ref.current?.measureInWindow((left, top, width, height) => onOpen?.({ left, top, width, height }));

  const body = (
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
        </>
      )}
    </Animated.View>
  );

  // Compact: the whole card opens the full life cycle (no «Δες περισσότερα» button)
  if (!onOpen) return body;
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${stage.title}: όλος ο κύκλος ζωής`}
      onPress={open}
      pressedScale={0.98}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // The same corners as the group buttons above the stages
  card: {
    ...card,
    borderRadius: radius.sm,
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  seed: {
    backgroundColor: colors.seedSoft,
  },
});
