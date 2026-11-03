import type { Lifecycle } from '@growme/shared';
import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { groupStages } from './stage-groups';
import { StagesBox } from './stages-box';
import { TabButtons } from './tab-buttons';

/**
 * The plant page's life cycle: the tab buttons (one per group the plant has stages for) and, under the one picked,
 * its stages in one box. Closed at first, with no tab picked: a tab opens its stages, another tab shows its own in
 * their place, and the open tab again closes them.
 */
export function LifecycleCard({
  stages,
  onReveal,
}: {
  stages: Lifecycle[];
  /** Scroll the page to the buttons, which are at this y on screen */
  onReveal: (windowY: number) => void;
}) {
  const reduced = useReducedMotion();
  const head = useRef<View>(null);
  const groups = useMemo(() => groupStages(stages), [stages]);
  const [lit, setLit] = useState<number | null>(null);

  // The page scrolls so the buttons sit near the top, the picked group's stages below them
  const reveal = () => head.current?.measureInWindow((_, y) => onReveal(y));

  const pick = (index: number) => {
    if (index === lit) {
      setLit(null);
      return;
    }
    setLit(index);
    reveal();
  };

  return (
    <View>
      <View ref={head} collapsable={false}>
        <TabButtons groups={groups} lit={lit} onPick={pick} />
      </View>
      <StagesBox group={lit === null ? null : (groups[lit] ?? null)} reduced={reduced} />
    </View>
  );
}
