import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { JumpButton } from '@/components/plants/lifecycle/jump-button';
import { firstOfGroup } from '@/components/plants/lifecycle/stage-groups';
import { LifecycleTimeline, type TimelineHandle } from '@/components/plants/lifecycle/timeline';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { usePlant } from '@/lib/plants';
import { colors, radius, size, space } from '@/theme';

/**
 * A plant's whole life cycle (from a stage's «Δες περισσότερα» on its page): every stage with its full
 * text, opened at the stage that was tapped, and the seed / transplant jump at the bottom.
 */
export default function LifecycleScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const topClearance = useTopClearance();
  const { plant, state, retry } = usePlant(Number(id));
  const timeline = useRef<TimelineHandle>(null);

  if (state === 'loading') {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />;
  }
  if (state === 'error' || !plant) {
    return (
      <View style={[styles.notFound, { marginTop: topClearance }]}>
        <AppText color={colors.inkMuted}>Δεν ήταν δυνατή η φόρτωση του κύκλου ζωής.</AppText>
        <PillButton label="Δοκίμασε ξανά" onPress={retry} />
      </View>
    );
  }

  const starts = firstOfGroup(plant.lifecycles);
  const bothGroups = starts.seed !== undefined && starts.plant !== undefined;
  const focusIndex = focus === undefined ? undefined : Number(focus);

  return (
    <View style={styles.page}>
      <View style={[styles.head, { paddingTop: topClearance }]}>
        <PillButton
          label="‹ Πίσω"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace({ pathname: '/plants/[id]', params: { id: String(plant.id) } })
          }
        />
        <AppText size="big" bold accessibilityRole="header">
          Κύκλος ζωής
        </AppText>
        <AppText color={colors.inkMuted}>{plant.name}</AppText>
      </View>

      {plant.lifecycles.length === 0 ? (
        <AppText color={colors.inkMuted} style={styles.empty}>
          Δεν υπάρχουν στάδια ακόμα.
        </AppText>
      ) : (
        <LifecycleTimeline
          ref={timeline}
          stages={plant.lifecycles}
          mode="full"
          focusIndex={focusIndex}
          // Room at the bottom for the jump button
          contentStyle={[styles.timeline, bothGroups && styles.timelineWithButton]}
        />
      )}

      {bothGroups && (
        <View style={styles.jump}>
          <JumpButton onJump={(group) => timeline.current?.scrollToGroup(group)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  head: {
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  timeline: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  timelineWithButton: {
    paddingBottom: size.touch + space.lg * 2,
  },
  jump: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  empty: {
    paddingHorizontal: space.md,
  },
  notFound: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
});
