import { durationLabel, type Lifecycle } from '@growme/shared';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type AnimatedRef, type SharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, shadow, space } from '@/theme';

import { firstLine } from './stage-groups';

/** The gap the halves open before the seed half goes behind */
const GAP = 12;
/** Where (in `split`) the halves stop separating and the seed half starts going behind */
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
  /** [index in the life cycle, stage] of each group */
  seed: [number, Lifecycle][];
  plant: [number, Lifecycle][];
  /** 0 joined → 1 the seed half pushed behind and the plant half in its place */
  split: SharedValue<number>;
  /** 1 once the seed half is out of the layout (the end of the split) */
  collapsed: SharedValue<number>;
  /** The seed half's height while it is shown */
  seedHeight: SharedValue<number>;
  /** Measured on the UI thread (which group is lit) */
  seedRef: AnimatedRef<Animated.View>;
  plantRef: AnimatedRef<Animated.View>;
};

/**
 * A life cycle's stages in one white rounded box, seed stages on top, the plant's own below.
 * When it splits, the halves separate, the seed half sinks behind and fades, the plant half moves up
 * to where the seed half started; then the seed half leaves the layout in the same frame as the plant
 * half's offset is reset, so nothing jumps. The reverse brings it back.
 */
export function StagesBox({ seed, plant, split, collapsed, seedHeight, seedRef, plantRef }: StagesBoxProps) {
  const both = seed.length > 0 && plant.length > 0;

  const seedStyle = useAnimatedStyle(() => {
    const s = split.get();
    const corner = interpolate(s, [0, APART], [both ? 0 : R, R], 'clamp');
    return {
      maxHeight: collapsed.get() ? 0 : 100000,
      opacity: interpolate(s, [APART, 1], [1, 0], 'clamp'),
      borderBottomLeftRadius: corner,
      borderBottomRightRadius: corner,
      transform: [
        { translateY: interpolate(s, [APART, 1], [0, seedHeight.get() * 0.3], 'clamp') },
        { scale: interpolate(s, [APART, 1], [1, 0.9], 'clamp') },
      ],
    };
  });
  const shade = useAnimatedStyle(() => ({ opacity: interpolate(split.get(), [APART, 1], [0, 0.25], 'clamp') }));

  const plantStyle = useAnimatedStyle(() => {
    const s = split.get();
    const corner = interpolate(s, [0, APART], [both ? 0 : R, R], 'clamp');
    const y = collapsed.get()
      ? 0
      : s <= APART
        ? interpolate(s, [0, APART], [0, GAP])
        : interpolate(s, [APART, 1], [GAP, -seedHeight.get()]);
    return { borderTopLeftRadius: corner, borderTopRightRadius: corner, transform: [{ translateY: y }] };
  });

  return (
    <View>
      {seed.length > 0 && (
        <Animated.View
          ref={seedRef}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0) seedHeight.set(height);
          }}
          style={[styles.half, styles.top, seedStyle]}>
          {seed.map(([, stage], i) => (
            <StageRow key={stage.id} stage={stage} first={i === 0} />
          ))}
          <Animated.View pointerEvents="none" style={[styles.shade, shade]} />
        </Animated.View>
      )}
      {plant.length > 0 && (
        // Later in the tree, so it passes over the seed half
        <Animated.View
          ref={plantRef}
          style={[styles.half, styles.bottom, both && styles.joint, plantStyle]}>
          {plant.map(([, stage], i) => (
            <StageRow key={stage.id} stage={stage} first={i === 0} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  half: {
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  top: {
    borderTopLeftRadius: R,
    borderTopRightRadius: R,
  },
  bottom: {
    borderBottomLeftRadius: R,
    borderBottomRightRadius: R,
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
