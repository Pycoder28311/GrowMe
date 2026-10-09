import { durationLabel, type Lifecycle } from '@growme/shared';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { IconCircle } from '@/components/plants/icon-circle';
import { AppText } from '@/components/ui/app-text';
import { FACT_ICONS } from '@/config/plant-icons';
import { useFlight } from '@/lib/flight';
import { space } from '@/theme';

import { GroupButtons } from './group-buttons';
import { StageCard } from './stage-card';
import type { StageGroup } from './stage-groups';
import { StagesBox } from './stages-box';

const SPLIT_MS = 650;

/**
 * The plant page's life cycle: «Κύκλος ζωής» with the lifespan, the two group buttons (the group more
 * on screen is lit) and the stages in one box. «Μεταμφύτευση» separates the seed stages and pushes them
 * behind, the plant's own stages move up; «Από σπόρο» brings them back. Each stage's «Δες περισσότερα»
 * grows into the full life cycle page.
 */
export function LifecycleCard({
  plantId,
  stages,
  lifespan,
  scrollY,
  visibleTop,
  onReveal,
}: {
  plantId: number;
  stages: Lifecycle[];
  lifespan: string | null;
  /** The page's scroll (for which group is lit) */
  scrollY: SharedValue<number>;
  /** Where the page's content starts on screen (under the corner buttons) */
  visibleTop: number;
  /** Scroll the page so this y on screen comes just under the corner buttons */
  onReveal: (windowY: number) => void;
}) {
  const fly = useFlight();
  const reduced = useReducedMotion();
  const screenHeight = useWindowDimensions().height;
  const head = useRef<View>(null);

  const seed = stages.flatMap((stage, index): [number, Lifecycle][] => (stage.seed ? [[index, stage]] : []));
  const plant = stages.flatMap((stage, index): [number, Lifecycle][] => (stage.seed ? [] : [[index, stage]]));
  const both = seed.length > 0 && plant.length > 0;

  const split = useSharedValue(0);
  const collapsed = useSharedValue(0);
  const seedHeight = useSharedValue(0);
  const [isSplit, setIsSplit] = useState(false);
  const seedRef = useAnimatedRef<Animated.View>();
  const plantRef = useAnimatedRef<Animated.View>();

  // The lit button: the group whose stages take more of the screen (measured on the UI thread)
  const [lit, setLit] = useState<StageGroup>(seed.length > 0 ? 'seed' : 'plant');
  const litNow = useSharedValue<StageGroup>(lit);
  useAnimatedReaction(
    () => [scrollY.get(), split.get()],
    () => {
      if (!both) return;
      const a = measure(seedRef);
      const b = measure(plantRef);
      if (!a || !b) return;
      const shown = (m: { pageY: number; height: number }) =>
        Math.max(0, Math.min(m.pageY + m.height, screenHeight) - Math.max(m.pageY, visibleTop));
      const next: StageGroup = collapsed.get() || shown(a) * (1 - split.get()) <= shown(b) ? 'plant' : 'seed';
      if (next !== litNow.get()) {
        litNow.set(next);
        scheduleOnRN(setLit, next);
      }
    },
  );

  // The page scrolls so the buttons sit under the corner buttons, the picked group's stages below them
  const reveal = () => head.current?.measureInWindow((_, y) => onReveal(y));

  const pick = (group: StageGroup) => {
    if (group === 'plant' && !isSplit) {
      setIsSplit(true);
      if (reduced) {
        split.set(1);
        collapsed.set(1);
      } else {
        split.set(
          withTiming(1, { duration: SPLIT_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
            if (finished) collapsed.set(1);
          }),
        );
      }
    } else if (group === 'seed' && isSplit) {
      setIsSplit(false);
      // Back in the layout first (the plant half's offset keeps it where it is), then out from behind
      collapsed.set(0);
      split.set(reduced ? 0 : withTiming(0, { duration: SPLIT_MS, easing: Easing.inOut(Easing.cubic) }));
    }
    reveal();
  };

  const open = (index: number, rect: Parameters<typeof fly>[0]['rect']) =>
    fly({
      rect,
      front: <StageCard stage={stages[index]} mode="compact" />,
      onLanded: () =>
        router.push({ pathname: '/plants/[id]/lifecycle', params: { id: String(plantId), focus: String(index) } }),
    });

  const lifespanLabel = durationLabel(lifespan);

  return (
    <View style={styles.root}>
      <View ref={head} collapsable={false} style={styles.head}>
        <AppText bold accessibilityRole="header" style={styles.title}>
          Κύκλος ζωής
        </AppText>
        {lifespanLabel && (
          <View style={styles.lifespan}>
            <AppText size="small">{lifespanLabel}</AppText>
            <IconCircle icon={FACT_ICONS.lifespan} size={24} />
          </View>
        )}
      </View>
      {both && <GroupButtons lit={isSplit ? 'plant' : lit} onPick={pick} />}
      <StagesBox
        seed={seed}
        plant={plant}
        onOpen={open}
        split={split}
        collapsed={collapsed}
        seedHeight={seedHeight}
        seedRef={seedRef}
        plantRef={plantRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  title: {
    flex: 1,
  },
  lifespan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
