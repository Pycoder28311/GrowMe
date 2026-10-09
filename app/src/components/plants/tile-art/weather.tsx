import type { WindLevel } from '@growme/shared';
import { StyleSheet } from 'react-native';
import { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

import type { Season } from '@/config/plant-traits';

import { ArtBox, ink, Layer, pivot, useLoop } from './layer';

type ArtProps = { playing: boolean };

/* ─────────────── Wind ─────────────── */

/** A wind turbine whose blades spin (fast for strong wind, slow for moderate) */
function Turbine({ playing, ms }: ArtProps & { ms: number }) {
  const t = useLoop(playing, ms, false);
  const blades = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.get() * 360}deg` }] }));
  return (
    <ArtBox>
      <Layer>
        <Path d="M26.5 54 L29.5 54 L28.8 22 L27.2 22 Z" fill={ink.steel} />
      </Layer>
      <Layer style={[styles.turbinePivot, blades]}>
        {[0, 120, 240].map((angle) => (
          <G key={angle} transform={`rotate(${angle} 28 22)`}>
            <Path d="M28 22 L26 7 Q28 3 30 7 Z" fill={ink.grayLight} stroke={ink.steel} strokeWidth={1} />
          </G>
        ))}
        <Circle cx={28} cy={22} r={2.6} fill={ink.steel} />
      </Layer>
    </ArtBox>
  );
}

/** Light wind: a leaf drifting on two breeze lines */
function DriftingLeaf({ playing }: ArtProps) {
  const t = useLoop(playing, 1600);
  const leaf = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.get(), [0, 1], [-8, 8]) },
      { translateY: interpolate(t.get(), [0, 0.5, 1], [2, -3, 2]) },
      { rotate: `${interpolate(t.get(), [0, 1], [-20, 20])}deg` },
    ],
  }));
  return (
    <ArtBox>
      <Layer>
        <Path d="M6 18 Q18 12 30 18 T50 16" stroke={ink.sky} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M10 46 Q22 40 34 46 T52 44" stroke={ink.sky} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Layer>
      <Layer style={[styles.centerPivot, leaf]}>
        <Path d="M20 32 Q28 22 38 28 Q30 38 20 32 Z" fill={ink.leaf} />
        <Path d="M21 32 Q29 29 37 28.5" stroke={ink.leafDark} strokeWidth={1} fill="none" />
      </Layer>
    </ArtBox>
  );
}

/** Wants shelter: a little plant behind a wall, barely moving */
function Sheltered({ playing }: ArtProps) {
  const t = useLoop(playing, 2200);
  const plant = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [-3, 3])}deg` }] }));
  return (
    <ArtBox>
      <Layer>
        <Path d="M0 26 Q4 24 8 26" stroke={ink.sky} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M0 38 Q4 36 8 38" stroke={ink.sky} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Rect x={10} y={18} width={14} height={36} rx={2} fill="#d1a782" />
        <Line x1={10} y1={27} x2={24} y2={27} stroke="#b88a63" strokeWidth={1} />
        <Line x1={10} y1={36} x2={24} y2={36} stroke="#b88a63" strokeWidth={1} />
        <Line x1={10} y1={45} x2={24} y2={45} stroke="#b88a63" strokeWidth={1} />
        <Line x1={17} y1={18} x2={17} y2={27} stroke="#b88a63" strokeWidth={1} />
        <Line x1={17} y1={36} x2={17} y2={45} stroke="#b88a63" strokeWidth={1} />
      </Layer>
      <Layer style={[styles.shelterPivot, plant]}>
        <Line x1={39} y1={54} x2={39} y2={32} stroke={ink.stem} strokeWidth={2} strokeLinecap="round" />
        <Path d="M39 40 Q31 36 30 30 Q37 31 39 40 Z" fill={ink.leaf} />
        <Path d="M39 36 Q47 32 48 26 Q41 27 39 36 Z" fill={ink.leaf} />
        <Circle cx={39} cy={30} r={3} fill={ink.leafDark} />
      </Layer>
    </ArtBox>
  );
}

/** One drawing per wind level */
export function WindArt({ level, playing }: ArtProps & { level: WindLevel }) {
  if (level === 'strong') return <Turbine playing={playing} ms={900} />;
  if (level === 'moderate') return <Turbine playing={playing} ms={2600} />;
  if (level === 'light') return <DriftingLeaf playing={playing} />;
  return <Sheltered playing={playing} />;
}

/* ─────────────── Seasons (the planting months) ─────────────── */

/** Spring: a bud opening on its stem */
function Bud({ playing }: ArtProps) {
  const t = useLoop(playing, 1400);
  const petals = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(t.get(), [0, 1], [0.7, 1.05]) }] }));
  return (
    <ArtBox>
      <Layer>
        <Line x1={28} y1={54} x2={28} y2={28} stroke={ink.stem} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M28 44 Q18 42 16 34 Q25 35 28 44 Z" fill={ink.leaf} />
        <Path d="M28 40 Q38 38 40 30 Q31 31 28 40 Z" fill={ink.leaf} />
      </Layer>
      <Layer style={[styles.budPivot, petals]}>
        <Path d="M28 28 Q19 22 22 12 Q27 18 28 28 Z" fill={ink.petal} />
        <Path d="M28 28 Q37 22 34 12 Q29 18 28 28 Z" fill={ink.petal} />
        <Path d="M28 28 Q24 16 28 8 Q32 16 28 28 Z" fill={ink.petalLight} />
      </Layer>
    </ArtBox>
  );
}

/** Summer: a sun whose rays turn and glow */
function Sun({ playing }: ArtProps) {
  const spin = useLoop(playing, 7000, false);
  const glow = useLoop(playing, 1200);
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  const core = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(glow.get(), [0, 1], [0.92, 1.06]) }] }));
  return (
    <ArtBox>
      <Layer style={[styles.centerPivot, rays]}>
        {Array.from({ length: 8 }, (_, i) => (
          <G key={i} transform={`rotate(${i * 45} 28 28)`}>
            <Line x1={28} y1={6} x2={28} y2={13} stroke={ink.sun} strokeWidth={3} strokeLinecap="round" />
          </G>
        ))}
      </Layer>
      <Layer style={[styles.centerPivot, core]}>
        <Circle cx={28} cy={28} r={10} fill={ink.sun} />
      </Layer>
    </ArtBox>
  );
}

/** Autumn: a leaf falling and swaying */
function FallingLeaf({ playing }: ArtProps) {
  const t = useLoop(playing, 2600, false);
  const leaf = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(t.get(), [0, 0.12, 0.85, 1], [0, 1, 1, 0]) : 1,
    transform: [
      { translateY: interpolate(t.get(), [0, 1], [-14, 14]) },
      { translateX: interpolate(t.get(), [0, 0.25, 0.5, 0.75, 1], [0, 7, 0, -7, 0]) },
      { rotate: `${interpolate(t.get(), [0, 0.25, 0.5, 0.75, 1], [0, 25, 0, -25, 0])}deg` },
    ],
  }));
  return (
    <ArtBox>
      <Layer style={[styles.centerPivot, leaf]}>
        <Path d="M28 16 Q38 20 36 30 Q32 38 28 40 Q24 38 20 30 Q18 20 28 16 Z" fill={ink.orange} />
        <Path d="M28 18 L28 44" stroke="#c4651c" strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M28 26 L33 23 M28 31 L23 28 M28 34 L32 32" stroke="#c4651c" strokeWidth={1} strokeLinecap="round" />
      </Layer>
    </ArtBox>
  );
}

/** Winter: a snowflake turning slowly as it floats */
function Snowflake({ playing, size = 1 }: ArtProps & { size?: number }) {
  const spin = useLoop(playing, 6000, false);
  const float = useLoop(playing, 1800);
  const flake = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.get(), [0, 1], [-3, 3]) },
      { rotate: `${spin.get() * 360}deg` },
      { scale: size },
    ],
  }));
  return (
    <Layer style={[styles.centerPivot, flake]}>
      {[0, 60, 120].map((angle) => (
        <G key={angle} transform={`rotate(${angle} 28 28)`}>
          <Line x1={28} y1={12} x2={28} y2={44} stroke={ink.snow} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M24 15 L28 19 L32 15 M24 41 L28 37 L32 41" stroke={ink.snow} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      ))}
    </Layer>
  );
}

/** All year: a calendar whose marked day moves along */
function AllYear({ playing }: ArtProps) {
  const t = useLoop(playing, 3200, false);
  const mark = useAnimatedStyle(() => ({ transform: [{ translateX: Math.min(3, Math.floor(t.get() * 4)) * 7 }] }));
  return (
    <ArtBox>
      <Layer>
        <Rect x={10} y={12} width={36} height={34} rx={5} fill={ink.white} stroke={ink.gray} strokeWidth={1.5} />
        <Path d="M10 17 Q10 12 15 12 L41 12 Q46 12 46 17 L46 21 L10 21 Z" fill={ink.orange} />
        <Line x1={18} y1={8} x2={18} y2={15} stroke={ink.gray} strokeWidth={2} strokeLinecap="round" />
        <Line x1={38} y1={8} x2={38} y2={15} stroke={ink.gray} strokeWidth={2} strokeLinecap="round" />
        {[0, 1, 2, 3].flatMap((col) =>
          [0, 1].map((row) => <Circle key={`${col}-${row}`} cx={17.5 + col * 7} cy={29 + row * 8} r={1.6} fill={ink.gray} />),
        )}
      </Layer>
      <Layer style={mark}>
        <Circle cx={17.5} cy={29} r={3.4} fill="none" stroke={ink.leafDark} strokeWidth={1.6} />
      </Layer>
    </ArtBox>
  );
}

/** One drawing per planting season */
export function SeasonArt({ season, playing }: ArtProps & { season: Season | 'all' }) {
  if (season === 'spring') return <Bud playing={playing} />;
  if (season === 'summer') return <Sun playing={playing} />;
  if (season === 'autumn') return <FallingLeaf playing={playing} />;
  if (season === 'all') return <AllYear playing={playing} />;
  return (
    <ArtBox>
      <Snowflake playing={playing} />
    </ArtBox>
  );
}

/* ─────────────── Frost ─────────────── */

/** Frost hardy: snowflakes land on a leaf that stays green */
export function FrostArt({ playing }: ArtProps) {
  const t = useLoop(playing, 2200, false);
  const flake = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(t.get(), [0, 0.15, 0.8, 1], [0, 1, 1, 0]) : 1,
    transform: [{ translateY: interpolate(t.get(), [0, 0.8, 1], [-18, 0, 0]) }],
  }));
  return (
    <ArtBox>
      <Layer>
        <Path d="M10 50 Q12 30 42 26 Q42 48 10 50 Z" fill={ink.leaf} />
        <Path d="M12 48 Q26 40 40 28" stroke={ink.leafDark} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </Layer>
      <Layer style={flake}>
        <G transform="translate(14 0) scale(0.5)">
          {[0, 60, 120].map((angle) => (
            <G key={angle} transform={`rotate(${angle} 28 28)`}>
              <Line x1={28} y1={14} x2={28} y2={42} stroke={ink.snow} strokeWidth={3.4} strokeLinecap="round" />
            </G>
          ))}
        </G>
      </Layer>
    </ArtBox>
  );
}

const styles = StyleSheet.create({
  turbinePivot: { transformOrigin: pivot(28, 22) },
  centerPivot: { transformOrigin: pivot(28, 28) },
  shelterPivot: { transformOrigin: pivot(39, 54) },
  budPivot: { transformOrigin: pivot(28, 28) },
});
