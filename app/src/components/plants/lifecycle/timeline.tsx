import { durationLabel, type Lifecycle } from '@growme/shared';
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Rect } from '@/config/search-motion';
import { colors, radius, space } from '@/theme';

import { StageCard } from './stage-card';
import { firstOfGroup, GROUP_LABELS, groupOf, type StageGroup } from './stage-groups';

/** What a page can ask the timeline to do */
export type TimelineHandle = { scrollToGroup: (group: StageGroup) => void };

type TimelineProps = {
  stages: Lifecycle[];
  /** compact: titles and teasers in a box of limited height; full: every text, the page's own scroll */
  mode: 'compact' | 'full';
  /** Compact: the stage showing its first line now (useTeaser) */
  teased?: number | null;
  /** Compact: a stage's «Δες περισσότερα» */
  onOpen?: (index: number, rect: Rect) => void;
  /** Full: the stage to show first */
  focusIndex?: number;
  /**
   * Compact: when the timeline is short enough not to scroll, a jump scrolls the page instead; this
   * gets the stage's row to bring into view
   */
  onRevealOutside?: (row: View) => void;
  ref?: Ref<TimelineHandle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const DURATION_WIDTH = 76;
const LINE_WIDTH = 20;
const DOT = 12;
/** The compact timeline scrolls inside this height */
const COMPACT_MAX_HEIGHT = 420;

/**
 * A plant's life cycle as a vertical line: each stage's time from sowing on the left, a dot on the
 * line, the stage on the right (every other one a little further right). The line is labelled where
 * the seed stages and the plant's own stages start.
 */
export function LifecycleTimeline({
  stages,
  mode,
  teased = null,
  onOpen,
  focusIndex,
  onRevealOutside,
  ref,
  contentStyle,
}: TimelineProps) {
  const scroll = useRef<ScrollView>(null);
  const rowTops = useRef<number[]>([]);
  const rows = useRef<(View | null)[]>([]);
  // Whether the compact box has more than it shows (else a jump scrolls the page)
  const sizes = useRef({ box: 0, content: 0 });
  const starts = firstOfGroup(stages);
  const scrolledToFocus = useRef(false);

  const scrollToIndex = (index: number, animated = true) => {
    const y = rowTops.current[index];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - space.sm), animated });
  };

  useImperativeHandle(ref, () => ({
    scrollToGroup: (group) => {
      const index = starts[group];
      if (index === undefined) return;
      const scrolls = mode === 'full' || sizes.current.content > sizes.current.box + 1;
      const row = rows.current[index];
      if (scrolls) scrollToIndex(index);
      else if (row) onRevealOutside?.(row);
    },
  }));

  // The full page opens at the stage that was tapped, once its place is known
  const focusOnLayout = (index: number) => {
    if (focusIndex === index && !scrolledToFocus.current) {
      scrolledToFocus.current = true;
      requestAnimationFrame(() => scrollToIndex(index, false));
    }
  };
  useEffect(() => {
    scrolledToFocus.current = false;
  }, [focusIndex]);

  return (
    <ScrollView
      ref={scroll}
      nestedScrollEnabled
      style={mode === 'compact' ? styles.compact : styles.full}
      onLayout={(event) => (sizes.current.box = event.nativeEvent.layout.height)}
      onContentSizeChange={(_, height) => (sizes.current.content = height)}
      contentContainerStyle={contentStyle}>
      {stages.map((stage, index) => {
        const group = groupOf(stage);
        const startsGroup = starts[group] === index;
        const duration = durationLabel(stage.duration);
        const last = index === stages.length - 1;
        return (
          <View
            key={stage.id}
            ref={(view) => {
              rows.current[index] = view;
            }}
            onLayout={(event) => {
              rowTops.current[index] = event.nativeEvent.layout.y;
              focusOnLayout(index);
            }}>
            {startsGroup && (
              <View style={styles.row}>
                <View style={styles.durationColumn} />
                <View style={styles.lineColumn}>{index > 0 && <View style={styles.line} />}</View>
                <AppText size="small" bold color={group === 'seed' ? colors.seed : colors.primary} style={styles.groupLabel}>
                  {GROUP_LABELS[group]}
                </AppText>
              </View>
            )}
            <View style={styles.row}>
              <View style={styles.durationColumn}>
                {duration && (
                  <AppText size="small" color={colors.inkMuted} style={styles.duration}>
                    {duration}
                  </AppText>
                )}
              </View>
              <View style={styles.lineColumn}>
                {/* The line runs through every dot; it stops at the last one */}
                {stages.length > 1 && (
                  <View style={[styles.line, last && styles.lineToDot, index === 0 && styles.lineFromDot]} />
                )}
                <View style={[styles.dot, { backgroundColor: group === 'seed' ? colors.seed : colors.primary }]} />
              </View>
              <View style={[styles.stage, index % 2 === 1 && styles.shifted]}>
                <StageCard
                  stage={stage}
                  mode={mode}
                  teased={teased === index}
                  onOpen={onOpen && ((rect) => onOpen(index, rect))}
                />
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  compact: {
    maxHeight: COMPACT_MAX_HEIGHT,
  },
  full: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  durationColumn: {
    width: DURATION_WIDTH,
    paddingTop: space.sm,
    paddingRight: space.xs,
  },
  duration: {
    textAlign: 'right',
  },
  lineColumn: {
    width: LINE_WIDTH,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  // The last stage: the line ends at its dot; the first: it starts there
  lineToDot: {
    bottom: undefined,
    height: space.sm + DOT / 2 + 2,
  },
  lineFromDot: {
    top: space.sm + DOT / 2,
  },
  dot: {
    width: DOT,
    height: DOT,
    marginTop: space.sm + 2,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  groupLabel: {
    paddingVertical: space.xs,
    paddingLeft: space.xs,
  },
  stage: {
    flex: 1,
    paddingBottom: space.sm,
    paddingLeft: space.xs,
  },
  // Every other stage, a little to the right
  shifted: {
    paddingLeft: space.md + space.xs,
  },
});
