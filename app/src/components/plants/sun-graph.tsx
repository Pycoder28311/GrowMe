import { SUN_PART_LABELS, sunLength, sunPart } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, space } from '@/theme';

const HOURS = 24;
const TICKS = [0, 6, 12, 18, 24];
const NIGHT = '#c9d3e6';
const DAY = '#fff3d6';

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
const percent = (hour: number) => `${(hour / HOURS) * 100}%` as const;

/**
 * The hours a plant wants sun, on a 00:00–24:00 bar (read-only; the dashboard's sun bar sets them),
 * with how long and which part of the day: «6 ώρες ήλιου · Μεσημεριανός ήλιος». Nothing when not set.
 */
export function SunGraph({ start, end }: { start: number | null; end: number | null }) {
  const hours = sunLength(start, end);
  if (hours === null || start === null || end === null) return null;
  const part = SUN_PART_LABELS[sunPart(start, end)];
  const length = `${hours} ${hours === 1 ? 'ώρα' : 'ώρες'} ήλιου`;

  return (
    <View
      accessible
      accessibilityLabel={`${length}, από ${clock(start)} έως ${clock(end)}. ${part}.`}
      style={styles.root}>
      <View style={styles.labels}>
        <AppText>
          {length} · {part}
        </AppText>
        <AppText size="small" color={colors.inkMuted}>
          {clock(start)}–{clock(end)}
        </AppText>
      </View>
      <View style={styles.track}>
        {/* The night at both ends of the day */}
        <View style={[styles.night, { left: 0, width: percent(6) }]} />
        <View style={[styles.night, { right: 0, width: percent(4) }]} />
        <View style={[styles.span, { left: percent(start), width: percent(end - start) }]} />
      </View>
      <View style={styles.ticks}>
        {TICKS.map((hour) => (
          <AppText key={hour} size="small" color={colors.inkMuted} style={[styles.tick, { left: percent(hour) }]}>
            {String(hour).padStart(2, '0')}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const TRACK = 10;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: space.xs,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: space.sm,
  },
  track: {
    height: TRACK,
    marginTop: space.xs,
    marginHorizontal: space.sm,
    borderRadius: radius.full,
    backgroundColor: DAY,
    overflow: 'hidden',
  },
  night: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: NIGHT,
  },
  span: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
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
