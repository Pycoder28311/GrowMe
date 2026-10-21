import { LIFECYCLE_TABS, stripBlogLinks, type Lifecycle, type LifecycleTab } from '@growme/shared';

// A life cycle's stages come in groups, one per tab (LIFECYCLE_TABS: from seed, from the plant after
// transplanting, care), in that order (the dashboard keeps them so). A tab with no stage has no group.

export type StageGroup = { tab: LifecycleTab; stages: [number, Lifecycle][] };

/** The groups the plant has stages for, in tab order; each stage with its index in the life cycle */
export const groupStages = (stages: readonly Lifecycle[]): StageGroup[] =>
  LIFECYCLE_TABS.flatMap((tab) => {
    const rows = stages.flatMap((stage, index): [number, Lifecycle][] => (stage.tab === tab ? [[index, stage]] : []));
    return rows.length > 0 ? [{ tab, stages: rows }] : [];
  });

/** A stage text's first line, as a reader sees it (blog links as plain words); '' when empty */
export function firstLine(content: string): string {
  const line = content.split('\n').find((text) => text.trim() !== '') ?? '';
  return stripBlogLinks(line).trim();
}
