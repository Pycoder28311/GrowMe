import { durationLabel, type Lifecycle } from '@growme/shared';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedRef,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { IconCircle } from '@/components/plants/icon-circle';
import { AppText } from '@/components/ui/app-text';
import { FACT_ICONS } from '@/config/plant-icons';
import { colors, radius, shadow, space } from '@/theme';

import { GroupButtons } from './group-buttons';
import type { StageGroup } from './stage-groups';
import { StagesBox } from './stages-box';

const SPLIT_MS = 650;

/**
 * The plant page's life cycle: «Κύκλος ζωής» with the lifespan, the two group buttons (the one picked is lit,
 * «Από σπόρο» at first; scrolling doesn't change it) and the stages in one box. «Μεταμφύτευση» separates the seed stages and pushes them
 * behind, the plant's own stages move up; «Από σπόρο» brings them back.
 */
export function LifecycleCard({
  stages,
  lifespan,
  onReveal,
}: {
  stages: Lifecycle[];
  lifespan: string | null;
  /** Scroll the page so this y on screen comes just under the corner buttons */
  onReveal: (windowY: number) => void;
}) {
  const reduced = useReducedMotion();
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

  const lifespanLabel = durationLabel(lifespan);

  return (
    <View style={styles.root}>
      <View ref={head} collapsable={false} style={styles.head}>
        <AppText bold accessibilityRole="header" style={styles.title}>
          Κύκλος ζωής
        </AppText>
        {lifespanLabel && (
          <View style={styles.lifespan}>
            <AppText bold style={styles.lifespanText}>
              {lifespanLabel}
            </AppText>
            <IconCircle icon={FACT_ICONS.lifespan} size={28} />
          </View>
        )}
      </View>
      {both && <GroupButtons lit={isSplit ? 'plant' : 'seed'} onPick={pick} />}
      <StagesBox
        seed={seed}
        plant={plant}
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
  // A size up from the page's section titles
  title: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  // How long it lives: a white pill with a shadow, so it stands out from the page's colour
  lifespan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  lifespanText: {
    fontSize: 16,
    lineHeight: 22,
  },
});
