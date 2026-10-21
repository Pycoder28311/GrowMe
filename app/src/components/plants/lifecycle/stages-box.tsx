import { durationLabel, type Lifecycle } from '@growme/shared';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, shadow, space } from '@/theme';

import { firstLine, type StageGroup } from './stage-groups';

/** Where (in a group's progress) it stops separating from its neighbours and starts going behind */
const APART = 0.3;
const R = radius.md;

/** One stage: title and its time on one line, then the start of its text */
function StageRow({ stage, first }: { stage: Lifecycle; first: boolean }) {
  const duration = durationLabel(stage.duration);
  const line = firstLine(stage.content);

  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={styles.titleRow}>
        <AppText bold style={styles.title}>
          {stage.title}
        </AppText>
        {duration && (
          <AppText size="small" color={colors.inkMuted}>
            {duration}
          </AppText>
        )}
      </View>
      {line !== '' && (
        <AppText size="small" color={colors.inkMuted} numberOfLines={2}>
          {line}
        </AppText>
      )}
    </View>
  );
}

type StagesBoxProps = {
  groups: readonly StageGroup[];
  /** Which group is in front: 0 is the first; between two whole numbers, the first of them is sinking behind */
  position: SharedValue<number>;
  /** The groups' heights while shown (set by the groups as they are measured) */
  heights: SharedValue<number[]>;
};

const progress = (position: number, index: number) => {
  'worklet';
  return Math.min(1, Math.max(0, position - index));
};

/** One group of stages in the box: it sinks behind and fades as `position` passes its index */
function GroupHalf({ group, index, count, position, heights }: { group: StageGroup; index: number; count: number; position: SharedValue<number>; heights: SharedValue<number[]> }) {
  const style = useAnimatedStyle(() => {
    const pos = position.get();
    const hs = heights.get();
    const p = progress(pos, index);
    // The groups before this one are moving up: this one follows them (until they leave the layout)
    let offset = 0;
    let earlier = 0;
    for (let k = 0; k < index; k++) {
      const pk = progress(pos, k);
      if (pk < 1) offset -= (hs[k] ?? 0) * pk;
      earlier = Math.max(earlier, pk);
    }
    const top = index === 0 ? R : interpolate(earlier, [0, APART], [0, R], 'clamp');
    const bottom = index === count - 1 ? R : interpolate(p, [0, APART], [0, R], 'clamp');
    return {
      maxHeight: p >= 1 ? 0 : 100000,
      opacity: interpolate(p, [APART, 1], [1, 0], 'clamp'),
      borderTopLeftRadius: top,
      borderTopRightRadius: top,
      borderBottomLeftRadius: bottom,
      borderBottomRightRadius: bottom,
      transform: [
        { translateY: offset + interpolate(p, [APART, 1], [0, (hs[index] ?? 0) * 0.3], 'clamp') },
        { scale: interpolate(p, [APART, 1], [1, 0.9], 'clamp') },
      ],
    };
  });
  const shade = useAnimatedStyle(() => ({ opacity: interpolate(progress(position.get(), index), [APART, 1], [0, 0.25], 'clamp') }));

  return (
    <Animated.View
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) heights.set(heights.get().map((h, i) => (i === index ? height : h)));
      }}
      style={[styles.half, index > 0 && styles.joint, style]}>
      {group.stages.map(([, stage], i) => (
        <StageRow key={stage.id} stage={stage} first={i === 0} />
      ))}
      <Animated.View pointerEvents="none" style={[styles.shade, shade]} />
    </Animated.View>
  );
}

/**
 * A life cycle's stages in one white rounded box, a group on top of the next (seed, plant, care). When a
 * later tab is picked the groups before it sink behind and fade, and the rest move up to where the first
 * one started; a group leaves the layout in the same frame as the ones after it stop being offset, so
 * nothing jumps. The box's height follows frame by frame, so what is below it on the page moves with it.
 */
export function StagesBox({ groups, position, heights }: StagesBoxProps) {
  const boxStyle = useAnimatedStyle(() => {
    const hs = heights.get();
    if (groups.length < 2 || hs.slice(0, groups.length).some((h) => h === 0)) return {};
    const pos = position.get();
    let total = 0;
    let offset = 0;
    for (let i = 0; i < groups.length; i++) {
      const p = progress(pos, i);
      if (p < 1) total += hs[i];
      if (i < groups.length - 1 && p < 1) offset -= hs[i] * p;
    }
    return { height: total + offset };
  });

  return (
    <Animated.View style={boxStyle}>
      {groups.map((group, index) => (
        <GroupHalf key={group.tab} group={group} index={index} count={groups.length} position={position} heights={heights} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  half: {
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  // The line between the two halves while they are joined
  joint: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 61, 36, 0.12)',
  },
  // Darkens the seed half as it goes behind (rounded like the half once it has split off)
  shade: {
    ...StyleSheet.absoluteFill,
    borderRadius: R,
    backgroundColor: '#000000',
  },
  row: {
    gap: space.xs,
    paddingVertical: space.sm + 2,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 61, 36, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
  },
  title: {
    flex: 1,
  },
});
