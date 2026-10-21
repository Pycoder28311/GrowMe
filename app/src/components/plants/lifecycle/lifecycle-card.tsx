import type { Lifecycle } from '@growme/shared';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { space } from '@/theme';

import { groupStages } from './stage-groups';
import { StagesBox } from './stages-box';
import { TabButtons } from './tab-buttons';

const SPLIT_MS = 650;

/**
 * The plant page's life cycle: the tab buttons (one per group the plant has stages for; the one picked is
 * lit, the first at first, and scrolling doesn't change it) and the stages in one box. Picking a later tab
 * pushes the groups before it behind and the rest move up; picking an earlier one brings them back.
 */
export function LifecycleCard({
  stages,
  onReveal,
}: {
  stages: Lifecycle[];
  /** Scroll the page so this y on screen comes just under the corner buttons */
  onReveal: (windowY: number) => void;
}) {
  const reduced = useReducedMotion();
  const head = useRef<View>(null);
  const groups = useMemo(() => groupStages(stages), [stages]);

  const [lit, setLit] = useState(0);
  const position = useSharedValue(0);
  const heights = useSharedValue<number[]>(groups.map(() => 0));

  // The page scrolls so the buttons sit under the corner buttons, the picked group's stages below them
  const reveal = () => head.current?.measureInWindow((_, y) => onReveal(y));

  const pick = (index: number) => {
    if (index !== lit) {
      setLit(index);
      position.set(reduced ? index : withTiming(index, { duration: SPLIT_MS, easing: Easing.inOut(Easing.cubic) }));
    }
    reveal();
  };

  return (
    <View style={styles.root}>
      {groups.length > 1 && (
        <View ref={head} collapsable={false}>
          <TabButtons groups={groups} lit={lit} onPick={pick} />
        </View>
      )}
      <StagesBox groups={groups} position={position} heights={heights} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
});
