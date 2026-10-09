import { SUN_PART_LABELS, sunLength, sunPart, type SunPart } from '@growme/shared';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

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
 * over a pale sky of that part of the day: the sun of that part, «6 ώρες ήλιου», the hours, a
 * light-orange span with a thin mark every 3 hours. Nothing when not set. A tap only shakes it.
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
        <SunSky part={part} />
        <View style={styles.labels}>
          <SunIcon part={part} />
          <AppText style={styles.length}>{length}</AppText>
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
        <AppText size="small" color={colors.inkMuted} style={styles.center}>
          Οι ιδανικές ώρες του φυτού για έκθεση στο φως μέσα στη μέρα
        </AppText>
      </View>
    </ShakeOnTap>
  );
}

const TRACK = 10;

/** The sky's colours, top to bottom, for each part of the day (kept pale so the bar reads first) */
const SKIES: Record<SunPart, [string, string]> = {
  morning: ['#ffe6cc', '#eaf4fb'],
  noon: ['#d6ecfb', '#f2f9fe'],
  afternoon: ['#ffd9bf', '#fdeee4'],
};

/** A small cartoon tree: a round crown or a pointed one, on a trunk */
function Tree({ x, scale = 1, pointed = false }: { x: number; scale?: number; pointed?: boolean }) {
  return (
    <G transform={`translate(${x} 40) scale(${scale}) translate(0 -40)`}>
      <Rect x={-1.5} y={30} width={3} height={10} rx={1} fill="#a98564" />
      {pointed ? (
        <Path d="M0 8 L9 32 L-9 32 Z" fill="#8cbf7a" />
      ) : (
        <>
          <Circle cx={0} cy={22} r={10} fill="#9fcf88" />
          <Circle cx={-6} cy={26} r={6} fill="#8cbf7a" />
        </>
      )}
    </G>
  );
}

/**
 * Behind the sun bar: a pale sky of that part of the day, a cloud, and a few distant trees in the
 * bottom corners. Quiet, so it doesn't pull the eye from the bar.
 */
function SunSky({ part }: { part: SunPart }) {
  const id = `sky-${useId().replace(/:/g, '')}`;
  const [top, bottom] = SKIES[part];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={10} height={10} fill={`url(#${id})`} />
      </Svg>
      <Svg width={70} height={28} viewBox="0 0 70 28" style={styles.cloud}>
        <Ellipse cx={24} cy={18} rx={18} ry={8} fill="#ffffff" opacity={0.75} />
        <Ellipse cx={40} cy={14} rx={14} ry={10} fill="#ffffff" opacity={0.75} />
        <Ellipse cx={52} cy={19} rx={12} ry={7} fill="#ffffff" opacity={0.75} />
      </Svg>
      <Svg width={60} height={40} viewBox="0 0 60 40" style={[styles.trees, styles.treesLeft]}>
        <G opacity={0.55}>
          <Tree x={14} />
          <Tree x={32} scale={0.7} pointed />
        </G>
      </Svg>
      <Svg width={60} height={40} viewBox="0 0 60 40" style={[styles.trees, styles.treesRight]}>
        <G opacity={0.55}>
          <Tree x={26} scale={0.6} pointed />
          <Tree x={44} scale={0.85} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.xs,
    overflow: 'hidden',
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.lg + space.sm,
    borderRadius: radius.md,
  },
  center: {
    textAlign: 'center',
  },
  cloud: {
    position: 'absolute',
    top: space.xs,
    right: '22%',
  },
  trees: {
    position: 'absolute',
    bottom: 0,
  },
  treesLeft: {
    left: 0,
  },
  treesRight: {
    right: 0,
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
