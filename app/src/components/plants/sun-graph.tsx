import { SUN_PART_LABELS, sunLength, sunPart, type SunPart } from '@growme/shared';
import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';

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
  const [lineY, setLineY] = useState(0);
  if (hours === null || start === null || end === null) return null;
  const part = sunPart(start, end);
  const length = `${hours} ${hours === 1 ? 'ώρα' : 'ώρες'} ήλιου`;

  return (
    <ShakeOnTap>
      <View
        accessible
        accessibilityLabel={`${length}, από ${clock(start)} έως ${clock(end)}. ${SUN_PART_LABELS[part]}.`}
        style={styles.root}>
        <SunSky part={part} lineY={lineY} />
        <View style={styles.labels}>
          <SunIcon part={part} />
          <AppText bold style={styles.length}>
            {length}
          </AppText>
          <AppText bold style={styles.range}>
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
        <AppText
          color={colors.inkMuted}
          style={styles.note}
          // The sky's edges only melt above a line a little below the middle of this one
          onLayout={(event) => setLineY(event.nativeEvent.layout.y + event.nativeEvent.layout.height / 2 + LINE_DROP)}>
          Οι ιδανικές ώρες του φυτού για έκθεση στο φως μέσα στη μέρα
        </AppText>
      </View>
    </ShakeOnTap>
  );
}

const TRACK = 10;

/** The sky's colours, top to bottom, for each part of the day (kept pale so the bar reads first) */
const SKIES: Record<SunPart, [string, string]> = {
  morning: ['#ffd2a8', '#eaf4fb'],
  noon: ['#bfe1f8', '#f2f9fe'],
  afternoon: ['#ffc7a3', '#fdeee4'],
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

/** How far the sky rises above the box, fading out: behind the last row of tiles over it */
const SKY_RISE = 300;

/** The fade's opacity along its height (an ease-in-out curve), from nothing at the top to the sky's colour */
const FADE: [number, number][] = [
  [0, 0],
  [0.1, 0.02],
  [0.2, 0.08],
  [0.3, 0.17],
  [0.4, 0.3],
  [0.5, 0.45],
  [0.6, 0.6],
  [0.7, 0.75],
  [0.8, 0.88],
  [0.9, 0.96],
  [1, 1],
];

/**
 * The sky's left and right edges melt away from the phrase's line upwards, in a fade of the same
 * width all the way up, so the edge stays a vertical line. The fade is centred on the box's side (the
 * sky is EDGE / 2 wider than the box on each side up there), so the middle of the fade is exactly
 * where the box's straight side below the line is: one continuous edge. It grows in smoothly over the
 * first RAMP px above the line. `above` is the distance (px) above the line.
 */
const EDGE = 48;
const OUT = EDGE / 2;
/** The line is this far below the phrase's middle; the fade still ends where it did (RAMP grew by as much) */
const LINE_DROP = 70;
const RAMP = 280 + LINE_DROP;
/** Eased (smootherstep: flat at both ends), so the fade grows very gently from nothing at the line to its full width RAMP px above it */
const edgeWidth = (above: number) => {
  const t = Math.min(1, above / RAMP);
  return EDGE * t * t * t * (t * (t * 6 - 15) + 10);
};
/** Above the phrase's line, a strip of the sky this tall (px) has one edge width */
const STRIP = 6;

/**
 * A smooth (smoothstep) opacity ramp at both sides of a strip as gradient stops: `edge` px wide,
 * centred OUT px in from each side of the `width` px strip
 */
function edgeStops(edge: number, width: number) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const ramp = (t: number) => t * t * (3 - 2 * t);
  const start = (OUT - edge / 2) / width;
  const length = edge / width;
  return [
    ...steps.map((t) => <Stop key={`l${t}`} offset={start + t * length} stopColor="#ffffff" stopOpacity={ramp(t)} />),
    ...[...steps]
      .reverse()
      .map((t) => <Stop key={`r${t}`} offset={1 - start - t * length} stopColor="#ffffff" stopOpacity={ramp(t)} />),
  ];
}

/** A soft white cloud (three puffs) */
function Cloud({ style, width = 70 }: { style: object; width?: number }) {
  return (
    <Svg width={width} height={(width * 28) / 70} viewBox="0 0 70 28" style={[styles.cloud, style]}>
      <Ellipse cx={24} cy={18} rx={18} ry={8} fill="#ffffff" opacity={0.75} />
      <Ellipse cx={40} cy={14} rx={14} ry={10} fill="#ffffff" opacity={0.75} />
      <Ellipse cx={52} cy={19} rx={12} ry={7} fill="#ffffff" opacity={0.75} />
    </Svg>
  );
}

/**
 * Behind the sun bar: a pale sky of that part of the day, with a few distant trees in the bottom
 * corners. Above the box the sky goes on, fading out upwards into the page, behind the last tiles
 * (they are drawn over it), with clouds up there too. Quiet, so it doesn't pull the eye from the bar.
 */
function SunSky({ part, lineY }: { part: SunPart; lineY: number }) {
  const id = `sky-${useId().replace(/:/g, '')}`;
  const [top, bottom] = SKIES[part];
  // The edges' widths are in px, so they need the sky's size (it is as wide as the box and SKY_RISE taller)
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width, height } = size;
  // The phrase's line in the sky's own coordinates
  const line = SKY_RISE + lineY;
  const strips = Math.max(1, Math.round(line / STRIP));
  const stripHeight = line / strips;
  return (
    <View
      pointerEvents="none"
      style={styles.skyArea}
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      {width > 0 && lineY > 0 && (
        <View style={styles.skyBox}>
          <Svg width={width} height={height}>
            <Defs>
              {/* Above the box: from nothing to the sky's top colour (eased: no visible start, no step at the box) */}
              <LinearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
                {FADE.map(([offset, opacity]) => (
                  <Stop key={offset} offset={offset} stopColor={top} stopOpacity={opacity} />
                ))}
              </LinearGradient>
              {/* The box: the sky's top colour to its bottom one */}
              <LinearGradient id={`${id}-box`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={top} />
                <Stop offset="1" stopColor={bottom} />
              </LinearGradient>
              {Array.from({ length: strips }, (_, i) => (
                <LinearGradient key={i} id={`${id}-e${i}`} x1="0" y1="0" x2="1" y2="0">
                  {edgeStops(edgeWidth(line - (i + 0.5) * stripHeight), width)}
                </LinearGradient>
              ))}
              {/* Opaque from the phrase's line down; above it, melting at the sides */}
              <Mask id={`${id}-m`} x={0} y={0} width={width} height={height} maskUnits="userSpaceOnUse">
                <Path
                  d={`M ${OUT} ${line} H ${width - OUT} V ${height - radius.md} A ${radius.md} ${radius.md} 0 0 1 ${width - OUT - radius.md} ${height} H ${OUT + radius.md} A ${radius.md} ${radius.md} 0 0 1 ${OUT} ${height - radius.md} Z`}
                  fill="#ffffff"
                />
                {Array.from({ length: strips }, (_, i) => (
                  // A little taller than its strip, so no seam shows between two
                  <Rect key={i} x={0} y={i * stripHeight} width={width} height={stripHeight + 1} fill={`url(#${id}-e${i})`} />
                ))}
              </Mask>
            </Defs>
            <G mask={`url(#${id}-m)`}>
              <Rect x={0} y={0} width={width} height={SKY_RISE} fill={`url(#${id}-fade)`} />
              <Rect x={0} y={SKY_RISE} width={width} height={height - SKY_RISE} fill={`url(#${id}-box)`} />
            </G>
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
      )}
      {/* Clouds up in the fading sky (behind the tiles) and one just inside the box */}
      <Cloud width={110} style={{ top: SKY_RISE * 0.38, left: '6%', opacity: 0.7 }} />
      <Cloud width={90} style={{ top: SKY_RISE * 0.62, right: '8%', opacity: 0.85 }} />
      <Cloud width={70} style={{ top: SKY_RISE * 0.82, left: '30%' }} />
      <Cloud style={{ top: SKY_RISE + space.xs, right: '22%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    // About 30% taller than before, the extra room at the bottom (more sky above the trees)
    paddingBottom: space.lg + space.sm + 40,
  },
  // The sky: the box and the fading part above it
  // As wide as the box plus OUT on each side (the fade above the bar is centred on the box's sides)
  skyArea: {
    position: 'absolute',
    top: -SKY_RISE,
    left: -OUT,
    right: -OUT,
    bottom: 0,
  },
  // The fading part and the box together
  skyBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // The line under the bar, a size up and a little lower, away from the hours
  note: {
    marginTop: space.md,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  cloud: {
    position: 'absolute',
  },
  trees: {
    position: 'absolute',
    bottom: 0,
  },
  treesLeft: {
    left: OUT,
  },
  treesRight: {
    right: OUT,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // «6 ώρες ήλιου», next to the sun: the box's title
  length: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
  },
  // «08:00 – 16:00»
  range: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
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
