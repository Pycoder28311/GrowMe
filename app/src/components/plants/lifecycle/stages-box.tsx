import { durationLabel, type Lifecycle } from '@growme/shared';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { LongLeafOutlineShape, PaperGrain } from '@/components/ui/flower-shapes';
import { tabDef } from '@/config/plant-page';
import { botanical, radius, serif, smallCaps, space, tileGrain, tileShadowStyle, tileTone } from '@/theme';

import { firstLine, type StageGroup } from './stage-groups';

/** Where (in a group's progress) it stops separating from its neighbours and starts going behind */
const APART = 0.3;
const R = radius.md;
/** The leaf's size and place, as on the rows below the squares (their height is 68) */
const LEAF = 68 * 1.7;

/**
 * One stage: a dot in its group's colour, its title in the serif and its time in a small solid pill (`pill`, over
 * the leaf), then the start of its text. A line above it, except the first, stops short of the leaf.
 */
function StageRow({ stage, first, color, pill }: { stage: Lifecycle; first: boolean; color: string; pill: string }) {
  const duration = durationLabel(stage.duration);
  const line = firstLine(stage.content);

  return (
    <View style={styles.row}>
      {!first && <View style={styles.divider} />}
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <AppText color={botanical.ink} style={styles.title}>
          {stage.title}
        </AppText>
        {duration && (
          <View style={[styles.duration, { backgroundColor: pill }]}>
            <AppText color={botanical.ink} style={smallCaps}>
              {duration}
            </AppText>
          </View>
        )}
      </View>
      {line !== '' && (
        <AppText color={botanical.inkMuted} numberOfLines={2} style={styles.line}>
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
  const { tone, color } = tabDef(group.tab);
  const shade = useAnimatedStyle(() => ({ opacity: interpolate(progress(position.get(), index), [APART, 1], [0, 0.25], 'clamp') }));

  return (
    <Animated.View
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) heights.set(heights.get().map((h, i) => (i === index ? height : h)));
      }}
      style={[styles.half, { backgroundColor: tone.background }, index > 0 && styles.joint, style]}>
      {/* The group's tint, a faint outlined leaf with a soft green inner shadow half out past the right edge like the
          rows' leaves, paper grain, then the stages over it (their time pills in front; their lines stop short of it) */}
      <LongLeafOutlineShape size={LEAF} color={tone.shape} glow={botanical.leaf} glowSpread={0.35} rotate={-62} opacity={0.45} style={styles.leaf} />
      <PaperGrain opacity={tileGrain} />
      {group.stages.map(([, stage], i) => (
        <StageRow key={stage.id} stage={stage} first={i === 0} color={color} pill={tone.circle} />
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
    // The squares' shadow, round the whole box
    <Animated.View style={[styles.boxShadow, boxStyle]}>
      {groups.map((group, index) => (
        <GroupHalf key={group.tab} group={group} index={index} count={groups.length} position={position} heights={heights} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  boxShadow: {
    borderRadius: R,
    backgroundColor: tileTone(0).background,
    ...tileShadowStyle,
  },
  half: {
    paddingHorizontal: space.md,
    overflow: 'hidden',
  },
  // The line between two groups while they are joined
  joint: {
    borderTopWidth: 1,
    borderTopColor: botanical.line,
  },
  leaf: {
    right: -68 * 0.55,
    top: -68 * 0.35,
  },
  // Darkens a group as it goes behind (rounded like the group once it has split off)
  shade: {
    ...StyleSheet.absoluteFill,
    borderRadius: R,
    backgroundColor: botanical.shade,
  },
  row: {
    gap: space.xs,
    paddingVertical: space.md - 2,
  },
  // The line above a stage, ending before the leaf's part of the group
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: LEAF * 0.45,
    height: 1,
    backgroundColor: botanical.lineSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // The stage's name in the serif, like the tiles' values
  title: {
    flex: 1,
    fontFamily: serif,
    fontSize: 19,
    lineHeight: 24,
  },
  duration: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  line: {
    fontSize: 15,
    lineHeight: 21,
  },
});
