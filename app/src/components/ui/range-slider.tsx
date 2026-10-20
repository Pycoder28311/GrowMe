import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { colors, iconSize, radius, shadow, space } from '@/theme';

const THUMB = iconSize.big;

type RangeSliderProps = {
  min: number;
  max: number;
  /** [from, to], whole numbers between min and max */
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  /** The numbers written under the track (they sit exactly at their steps) */
  ticks: number[];
  /** Read by screen readers, e.g. "Ώρες έντονου φωτός" */
  label: string;
};

/**
 * A track with two thumbs, for a range: drag a thumb (the nearer one to where the finger lands) or tap
 * the track to move it. The thumbs never cross and move in whole steps.
 */
export function RangeSlider({ min, max, value, onChange, ticks, label }: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  const [from, to] = value;
  const track = Math.max(0, width - THUMB);
  const span = max - min;
  const xOf = (v: number) => ((v - min) / span) * track;
  // Which thumb the current touch moves: 0 the first, 1 the second
  const active = useSharedValue(0);

  const valueAt = (x: number) => Math.min(max, Math.max(min, Math.round(((x - THUMB / 2) / track) * span) + min));

  const choose = (x: number) => {
    if (track === 0) return;
    // The thumb nearer to the touch; on a tie, the one that can move towards it
    const dFrom = Math.abs(x - THUMB / 2 - xOf(from));
    const dTo = Math.abs(x - THUMB / 2 - xOf(to));
    active.set(dFrom < dTo || (dFrom === dTo && x < xOf(from)) ? 0 : 1);
  };
  const move = (x: number) => {
    if (track === 0) return;
    const v = valueAt(x);
    if (active.get() === 0) {
      const next = Math.min(v, to);
      if (next !== from) onChange([next, to]);
    } else {
      const next = Math.max(v, from);
      if (next !== to) onChange([from, next]);
    }
  };

  // Horizontal drags move a thumb; vertical ones are left to the scrolling sheet
  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin((event) => choose(event.x))
    .onUpdate((event) => move(event.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onBegin((event) => choose(event.x))
    .onEnd((event) => move(event.x));

  return (
    <View>
      <GestureDetector gesture={Gesture.Race(drag, tap)}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ text: `${from} έως ${to}` }}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.area}>
          <View style={styles.rail} />
          <View style={[styles.rail, styles.filled, { left: THUMB / 2 + xOf(from), width: xOf(to) - xOf(from) }]} />
          <View style={[styles.thumb, { left: xOf(from) }]} />
          <View style={[styles.thumb, { left: xOf(to) }]} />
        </View>
      </GestureDetector>

      {/* Each tick is as wide as a thumb, so spread edge to edge it is centred under its step */}
      <View style={styles.ticks}>
        {ticks.map((tick) => (
          <AppText key={tick} size="small" color={colors.inkMuted} style={styles.tick}>
            {tick}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    height: THUMB + space.sm,
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  filled: {
    right: undefined,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    boxShadow: shadow.raised,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: {
    width: THUMB,
    textAlign: 'center',
  },
});
