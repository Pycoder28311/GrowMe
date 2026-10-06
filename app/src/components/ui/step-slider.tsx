import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/ui/app-text';
import { colors, iconSize, radius, shadow, space } from '@/theme';

const THUMB = iconSize.big;
const STOP = iconSize.small;

type StepSliderProps = {
  /** The values to choose from, left to right (e.g. 0, 3, 6, 9, 12) */
  stops: number[];
  value: number;
  onChange: (value: number) => void;
  /** Read by screen readers, e.g. "Ώρες ήλιου" */
  label: string;
};

/** A track with evenly spaced stops: tap a stop or drag along it to pick a value */
export function StepSlider({ stops, value, onChange, label }: StepSliderProps) {
  const [width, setWidth] = useState(0);
  // Stops sit between the thumb's half-widths, so the end ones never get cut off
  const track = Math.max(0, width - THUMB);
  const index = Math.max(0, stops.indexOf(value));
  const xOf = (i: number) => (stops.length > 1 ? (i / (stops.length - 1)) * track : 0);

  const pick = (x: number) => {
    if (track === 0) return;
    const nearest = Math.round(((x - THUMB / 2) / track) * (stops.length - 1));
    const next = stops[Math.min(stops.length - 1, Math.max(0, nearest))];
    if (next !== value) onChange(next);
  };

  // Horizontal drags move the thumb; vertical ones are left to the scrolling sheet
  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onUpdate((event) => pick(event.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event) => pick(event.x));

  const step = (by: number) => onChange(stops[Math.min(stops.length - 1, Math.max(0, index + by))]);

  return (
    <View>
      <GestureDetector gesture={Gesture.Race(drag, tap)}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ text: String(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.area}>
          <View style={styles.rail} />
          <View style={[styles.rail, styles.filled, { width: xOf(index) }]} />
          {stops.map((stop, i) => (
            <View
              key={stop}
              style={[styles.stop, i <= index && styles.stopPassed, { left: THUMB / 2 + xOf(i) - STOP / 2 }]}
            />
          ))}
          <View style={[styles.thumb, { left: xOf(index) }]} />
        </View>
      </GestureDetector>

      {/* Same width as the thumb, spread edge to edge: each label is centred under its stop */}
      <View style={styles.labels}>
        {stops.map((stop) => (
          <AppText key={stop} size="small" color={stop === value ? colors.primary : colors.inkMuted} bold={stop === value} style={styles.label}>
            {stop}
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
  stop: {
    position: 'absolute',
    width: STOP,
    height: STOP,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.inkMuted,
    backgroundColor: colors.surface,
  },
  stopPassed: {
    borderColor: colors.primary,
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
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    width: THUMB,
    textAlign: 'center',
  },
});
