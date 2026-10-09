import { SUN_PART_LABELS, sunLength, sunPart } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { SunIcon } from '@/components/plants/sun-icon';
import { AppText } from '@/components/ui/app-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { colors, radius, space } from '@/theme';

const HOURS = 24;
const TICKS = [0, 6, 12, 18, 24];
/** A thin mark every 3 hours on the bar */
const MARKS = [3, 6, 9, 12, 15, 18, 21];
const TRACK_COLOR = '#ecebe8';
const SPAN_COLOR = '#ffb867';

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
const percent = (hour: number) => `${(hour / HOURS) * 100}%` as const;

/**
 * The hours a plant wants sun, on a 00:00–24:00 bar (read-only; the dashboard's sun bar sets them),
 * with no card behind it: the sun of that part of the day, «6 ώρες ήλιου · Μεσημεριανός ήλιος», the
 * hours, a light-orange span with a thin mark every 3 hours. Nothing when not set. A tap only shakes it.
 */
export function SunBar({ start, end }: { start: number | null; end: number | null }) {
  const hours = sunLength(start, end);
  if (hours === null || start === null || end === null) return null;
  const part = sunPart(start, end);
  const length = `${hours} ${hours === 1 ? 'ώρα' : 'ώρες'} ήλιου`;

  return (
    <ShakeOnTap>
      <View
        accessible
        accessibilityLabel={`${length}, από ${clock(start)} έως ${clock(end)}. ${SUN_PART_LABELS[part]}.`}
        style={styles.root}>
        <View style={styles.labels}>
          <SunIcon part={part} />
          <AppText style={styles.length}>
            {length} · {SUN_PART_LABELS[part]}
          </AppText>
          <AppText size="small" color={colors.inkMuted}>
            {clock(start)} – {clock(end)}
          </AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.span, { left: percent(start), width: percent(end - start) }]} />
          {MARKS.map((hour) => (
            <View key={hour} style={[styles.mark, { left: percent(hour) }]} />
          ))}
        </View>
        <View style={styles.ticks}>
          {TICKS.map((hour) => (
            <AppText key={hour} size="small" color={colors.inkMuted} style={[styles.tick, { left: percent(hour) }]}>
              {String(hour).padStart(2, '0')}
            </AppText>
          ))}
        </View>
        <AppText size="small" color={colors.inkMuted}>
          Οι ιδανικές ώρες του φυτού για έκθεση στο φως μέσα στη μέρα
        </AppText>
      </View>
    </ShakeOnTap>
  );
}

const TRACK = 10;

const styles = StyleSheet.create({
  root: {
    gap: space.xs,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  length: {
    flex: 1,
  },
  track: {
    height: TRACK,
    marginTop: space.xs,
    marginHorizontal: space.sm,
    borderRadius: radius.full,
    backgroundColor: TRACK_COLOR,
    overflow: 'hidden',
  },
  span: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
    backgroundColor: SPAN_COLOR,
  },
  // A thin black line across the bar
  mark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth * 2,
    marginLeft: -StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  ticks: {
    height: 16,
    marginHorizontal: space.sm,
  },
  // Centred under its hour
  tick: {
    position: 'absolute',
    width: 24,
    marginLeft: -12,
    textAlign: 'center',
  },
});
