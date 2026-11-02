import { durationLabel, type Lifecycle } from '@growme/shared';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { LongLeafOutlineShape, PaperGrain } from '@/components/ui/flower-shapes';
import { tabDef } from '@/config/plant-page';
import { botanical, radius, serif, smallCaps, space, tileGrain, tileShadowStyle, tileTone } from '@/theme';

import { firstLine, type StageGroup } from './stage-groups';

const R = radius.md;
/** The leaf's size and place, as on the rows below the squares (their height is 68) */
const LEAF = 68 * 1.7;
/** The box's height follows its stages: opening, closing and changing tab */
const RESIZE = { duration: 380, easing: Easing.inOut(Easing.cubic) };
/** A tab's stages fade in over the box's beige */
const FADE_MS = 260;
/** Room round the box inside the clip that opens it, so its shadow isn't cut off (the tiles' shadow: blur 8, 3 down) */
const SHADOW_ROOM = 12;

/** The box's height going to `to`: at once with Reduce Motion */
const resized = (to: number, reduced: boolean) => (reduced ? to : withTiming(to, RESIZE));

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

/** One tab's stages in its tint: they fade in when the tab is picked (a new tab mounts a new one) */
function GroupPanel({ group }: { group: StageGroup }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(withTiming(1, { duration: FADE_MS }));
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const { tone, color } = tabDef(group.tab);

  return (
    <Animated.View style={[styles.panel, { backgroundColor: tone.background }, style]}>
      {/* The group's tint, a faint outlined leaf with a soft green inner shadow half out past the right edge like the
          rows' leaves, paper grain, then the stages over it (their time pills in front; their lines stop short of it) */}
      <LongLeafOutlineShape size={LEAF} color={tone.shape} glow={botanical.leaf} glowSpread={0.35} rotate={-62} opacity={0.45} style={styles.leaf} />
      <PaperGrain opacity={tileGrain} />
      {group.stages.map(([, stage], i) => (
        <StageRow key={stage.id} stage={stage} first={i === 0} color={color} pill={tone.circle} />
      ))}
    </Animated.View>
  );
}

/**
 * The picked tab's stages in one rounded box under the tabs; closed (no height) while no tab is picked. Opening
 * and changing tab only resize the box to its new stages, which fade in: no other tab's stages ever show. Closing
 * keeps the last stages in it while it folds away.
 */
export function StagesBox({ group, reduced }: { group: StageGroup | null; reduced: boolean }) {
  // The stages in the box: the picked tab's, or the last ones while it closes
  const [shown, setShown] = useState(group);
  if (group !== null && group !== shown) setShown(group);

  const height = useSharedValue(0);
  // The box's height as last measured, and whose stages it was
  const measured = useRef<{ tab: string; height: number } | null>(null);

  // Closing, or opening again on the stages already measured (a new tab's are measured as they mount, in onLayout)
  useEffect(() => {
    if (group === null) height.set(resized(0, reduced));
    else if (measured.current?.tab === group.tab) height.set(resized(measured.current.height, reduced));
  }, [group, reduced, height]);

  console.log('DEBUG StagesBox render', group?.tab ?? null, shown?.tab ?? null, reduced);
  const onLayout = (event: LayoutChangeEvent) => {
    console.log('DEBUG StagesBox onLayout', shown?.tab ?? null, group?.tab ?? null, event.nativeEvent.layout.height);
    if (!shown) return;
    measured.current = { tab: shown.tab, height: event.nativeEvent.layout.height };
    if (group !== null) height.set(resized(measured.current.height, reduced));
  };

  const clip = useAnimatedStyle(() => ({ height: height.get() }));

  return (
    <Animated.View style={[styles.clip, clip]}>
      {shown && (
        // Mounted again for each tab, so its stages are always measured and fade in
        <View key={shown.tab} onLayout={onLayout} style={styles.room}>
          {/* The squares' shadow and the stages' beige under the tab's tint, as it fades in */}
          <View style={styles.box}>
            <GroupPanel group={shown} />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    marginHorizontal: -SHADOW_ROOM,
  },
  room: {
    paddingTop: space.sm,
    paddingHorizontal: SHADOW_ROOM,
    paddingBottom: SHADOW_ROOM,
  },
  box: {
    borderRadius: R,
    backgroundColor: tileTone(0).background,
    ...tileShadowStyle,
  },
  panel: {
    paddingHorizontal: space.md,
    borderRadius: R,
    overflow: 'hidden',
  },
  leaf: {
    right: -68 * 0.55,
    top: -68 * 0.35,
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
