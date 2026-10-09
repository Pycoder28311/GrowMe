import type { Lifecycle } from '@growme/shared';
import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { card } from '@/components/ui/styles';
import { useFlight } from '@/lib/flight';
import { space } from '@/theme';

import { JumpButton } from './jump-button';
import { StageCard } from './stage-card';
import { firstOfGroup } from './stage-groups';
import { LifecycleTimeline, type TimelineHandle } from './timeline';
import { useTeaser } from './use-teaser';

/**
 * The plant page's life cycle: the timeline in a card, the jump between seed and plant stages, a
 * teaser line now and then, and each stage's «Δες περισσότερα» growing into the full life cycle page.
 */
export function LifecycleCard({
  plantId,
  stages,
  onRevealOutside,
}: {
  plantId: number;
  stages: Lifecycle[];
  /** A jump when the timeline fits without scrolling: the page brings this stage's row into view */
  onRevealOutside?: (row: View) => void;
}) {
  const timeline = useRef<TimelineHandle>(null);
  const teased = useTeaser(stages.length);
  const fly = useFlight();
  const starts = firstOfGroup(stages);
  const bothGroups = starts.seed !== undefined && starts.plant !== undefined;

  const open = (index: number, rect: Parameters<typeof fly>[0]['rect']) =>
    fly({
      rect,
      front: <StageCard stage={stages[index]} mode="compact" />,
      onLanded: () =>
        router.push({ pathname: '/plants/[id]/lifecycle', params: { id: String(plantId), focus: String(index) } }),
    });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText bold accessibilityRole="header">
          🌱 Κύκλος ζωής
        </AppText>
        {bothGroups && <JumpButton onJump={(group) => timeline.current?.scrollToGroup(group)} />}
      </View>
      <LifecycleTimeline
        ref={timeline}
        stages={stages}
        mode="compact"
        teased={teased}
        onOpen={open}
        onRevealOutside={onRevealOutside}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
});
