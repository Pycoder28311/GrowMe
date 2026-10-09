import { stripBlogLinks, type Lifecycle } from '@growme/shared';

// A life cycle's stages come in two groups, seed stages first (the dashboard keeps them in that order):
// from seed (before the plant is sold ready to plant) and from the plant itself (after transplanting).

export type StageGroup = 'seed' | 'plant';

export const groupOf = (stage: Lifecycle): StageGroup => (stage.seed ? 'seed' : 'plant');

/** Where each group starts in the list (undefined when the plant has no stage of it) */
export function firstOfGroup(stages: readonly Lifecycle[]): Partial<Record<StageGroup, number>> {
  const seed = stages.findIndex((stage) => stage.seed);
  const plant = stages.findIndex((stage) => !stage.seed);
  return { ...(seed >= 0 && { seed }), ...(plant >= 0 && { plant }) };
}

/** The label on the line where each group starts */
export const GROUP_LABELS: Record<StageGroup, string> = {
  seed: '🌰 Από σπόρο',
  plant: '🪴 Μεταμφύτευση',
};

/** A stage text's first line, as a reader sees it (blog links as plain words); '' when empty */
export function firstLine(content: string): string {
  const line = content.split('\n').find((text) => text.trim() !== '') ?? '';
  return stripBlogLinks(line).trim();
}
