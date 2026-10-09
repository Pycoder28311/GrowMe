import { useState } from 'react';

import { PillButton } from '@/components/ui/pill-button';

import type { StageGroup } from './stage-groups';

const LABELS: Record<StageGroup, string> = { plant: 'Μεταμφύτευση', seed: 'Από σπόρο' };

/**
 * One button that jumps between a life cycle's two groups: «Μεταμφύτευση» goes to the first stage of
 * the plant itself, then it becomes «Από σπόρο» and goes back to the first seed stage, and so on.
 */
export function JumpButton({ onJump }: { onJump: (group: StageGroup) => void }) {
  const [target, setTarget] = useState<StageGroup>('plant');
  return (
    <PillButton
      label={LABELS[target]}
      onPress={() => {
        onJump(target);
        setTarget(target === 'plant' ? 'seed' : 'plant');
      }}
    />
  );
}
