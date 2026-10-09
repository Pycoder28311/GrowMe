import type { PlantKind, PlantSize } from '@growme/shared';
import { StyleSheet } from 'react-native';
import { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import { ArtBox, ink, Layer, pivot, useLoop } from './layer';

type ArtProps = { playing: boolean };

/* ─────────────── Βρώσιμο ─────────────── */

/** The tomato on its stalk, hanging from a node (gray when not edible) */
function Tomato({ gray = false }: { gray?: boolean }) {
  return (
    <>
      <Line x1={28} y1={10} x2={28} y2={22} stroke={gray ? ink.gray : ink.stem} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={28} cy={34} r={13} fill={gray ? ink.grayLight : ink.tomato} />
      <Path d="M22 22 L28 25 L34 22 L31 27 L25 27 Z" fill={gray ? ink.gray : ink.leafDark} />
      {!gray && <Ellipse cx={22} cy={30} rx={2.4} ry={4} fill="#ff8a7d" opacity={0.7} />}
    </>
  );
}

/** The branch the tomato hangs from */
function Branch({ gray = false }: { gray?: boolean }) {
  return (
    <>
      <Path d="M4 10 Q28 6 52 11" stroke={gray ? ink.gray : ink.stem} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={28} cy={9} r={2.6} fill={gray ? ink.gray : ink.leafDark} />
    </>
  );
}

/** Edible: a ripe tomato hanging from a node, shaking a little as if ready to fall */
function TomatoYes({ playing }: ArtProps) {
  const t = useLoop(playing, 1800, false);
  const tomato = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(t.get(), [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 1], [0, 7, -6, 5, -4, 2, 0, 0])}deg` },
    ],
  }));
  return (
    <ArtBox>
      <Layer>
        <Branch />
      </Layer>
      <Layer style={[styles.nodePivot, tomato]}>
        <Tomato />
      </Layer>
    </ArtBox>
  );
}

/** Not edible: the same tomato, gray and crossed out, swaying slowly */
function TomatoNo({ playing }: ArtProps) {
  const t = useLoop(playing, 2400);
  const tomato = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [-3, 3])}deg` }] }));
  return (
    <ArtBox>
      <Layer>
        <Branch gray />
      </Layer>
      <Layer style={[styles.nodePivot, tomato]}>
        <Tomato gray />
        <Circle cx={28} cy={34} r={15} fill="none" stroke={ink.tomato} strokeWidth={2.4} />
        <Line x1={18} y1={44} x2={38} y2={24} stroke={ink.tomato} strokeWidth={2.4} strokeLinecap="round" />
      </Layer>
    </ArtBox>
  );
}

export const FoodArt = ({ edible, playing }: ArtProps & { edible: boolean }) =>
  edible ? <TomatoYes playing={playing} /> : <TomatoNo playing={playing} />;

/* ─────────────── Pot (succulents, sizes) ─────────────── */

function Pot() {
  return (
    <>
      <Path d="M16 42 L40 42 L37 54 L19 54 Z" fill={ink.pot} />
      <Path d="M14 39 L42 39 L42 43 L14 43 Z" fill={ink.potDark} />
    </>
  );
}

/* ─────────────── Παχύφυτο ─────────────── */

/** Succulent: a plump rosette that breathes */
function Rosette({ playing }: ArtProps) {
  const t = useLoop(playing, 1600);
  const rosette = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(t.get(), [0, 1], [0.94, 1.06]) }] }));
  return (
    <ArtBox>
      <Layer>
        <Pot />
      </Layer>
      <Layer style={[styles.potPivot, rosette]}>
        {[-60, -30, 0, 30, 60].map((angle) => (
          <G key={angle} transform={`rotate(${angle} 28 39)`}>
            <Ellipse cx={28} cy={27} rx={5.5} ry={11} fill={angle === 0 ? ink.leafDark : '#7fbf8e'} />
          </G>
        ))}
        <Ellipse cx={28} cy={33} rx={4} ry={6} fill="#a5d6a7" />
      </Layer>
    </ArtBox>
  );
}

/** Not a succulent: one thin leaf swaying */
function ThinLeaf({ playing }: ArtProps) {
  const t = useLoop(playing, 1800);
  const leaf = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [-8, 8])}deg` }] }));
  return (
    <ArtBox>
      <Layer>
        <Pot />
      </Layer>
      <Layer style={[styles.potPivot, leaf]}>
        <Path d="M28 40 Q22 24 30 6 Q31 24 28 40 Z" fill={ink.leaf} />
        <Path d="M28 40 Q36 30 44 22 Q38 32 28 40 Z" fill={ink.leaf} opacity={0.8} />
      </Layer>
    </ArtBox>
  );
}

export const SucculentArt = ({ succulent, playing }: ArtProps & { succulent: boolean }) =>
  succulent ? <Rosette playing={playing} /> : <ThinLeaf playing={playing} />;

/* ─────────────── Αναρριχητικό, καλλωπιστικό, αρωματικό ─────────────── */

/** Climbing: a vine curling up a stick, growing and settling */
export function ClimbingArt({ playing }: ArtProps) {
  const t = useLoop(playing, 2000);
  const vine = useAnimatedStyle(() => ({ transform: [{ scaleY: interpolate(t.get(), [0, 1], [0.86, 1]) }] }));
  return (
    <ArtBox>
      <Layer>
        <Line x1={28} y1={54} x2={28} y2={6} stroke={ink.wood} strokeWidth={3} strokeLinecap="round" />
      </Layer>
      <Layer style={[styles.groundPivot, vine]}>
        <Path
          d="M28 54 Q18 48 28 42 Q38 36 28 30 Q18 24 28 18 Q36 13 30 8"
          stroke={ink.stem}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M22 45 Q14 44 13 38 Q20 39 22 45 Z" fill={ink.leaf} />
        <Path d="M34 33 Q42 32 43 26 Q36 27 34 33 Z" fill={ink.leaf} />
        <Path d="M22 21 Q14 20 13 14 Q20 15 22 21 Z" fill={ink.leaf} />
      </Layer>
    </ArtBox>
  );
}

/** Five petals around a yellow centre */
function Flower({ petal = ink.petal }: { petal?: string }) {
  return (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <G key={angle} transform={`rotate(${angle} 28 28)`}>
          <Ellipse cx={28} cy={17} rx={6.5} ry={10} fill={petal} />
        </G>
      ))}
    </>
  );
}

/** Ornamental: a flower opening and closing */
export function OrnamentalArt({ playing }: ArtProps) {
  const t = useLoop(playing, 1500);
  const petals = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.get(), [0, 1], [0.75, 1]) }, { rotate: `${interpolate(t.get(), [0, 1], [-10, 10])}deg` }],
  }));
  return (
    <ArtBox>
      <Layer style={[styles.centerPivot, petals]}>
        <Flower />
      </Layer>
      <Layer>
        <Circle cx={28} cy={28} r={6} fill={ink.sun} />
      </Layer>
    </ArtBox>
  );
}

/** Aromatic: a sprig with scent curls rising from it */
export function AromaticArt({ playing }: ArtProps) {
  const t = useLoop(playing, 2200, false);
  const scent = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(t.get(), [0, 0.2, 0.8, 1], [0, 1, 0.8, 0]) : 1,
    transform: [{ translateY: interpolate(t.get(), [0, 1], [6, -6]) }],
  }));
  return (
    <ArtBox>
      <Layer>
        <Line x1={28} y1={54} x2={28} y2={30} stroke={ink.stem} strokeWidth={2} strokeLinecap="round" />
        {[34, 40, 46].map((y, i) => (
          <G key={y}>
            <Ellipse cx={22} cy={y} rx={5} ry={2.6} fill={ink.leaf} transform={`rotate(${-25 + i * 5} 22 ${y})`} />
            <Ellipse cx={34} cy={y - 2} rx={5} ry={2.6} fill={ink.leaf} transform={`rotate(${25 - i * 5} 34 ${y - 2})`} />
          </G>
        ))}
        <Ellipse cx={28} cy={29} rx={2.6} ry={4} fill={ink.leaf} />
      </Layer>
      <Layer style={scent}>
        {[18, 28, 38].map((x) => (
          <Path
            key={x}
            d={`M${x} 24 Q${x - 4} 19 ${x} 15 Q${x + 4} 11 ${x} 6`}
            stroke="#b39ddb"
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </Layer>
    </ArtBox>
  );
}

/* ─────────────── Kind ─────────────── */

/** Flowering: a flower slowly turning */
function TurningFlower({ playing }: ArtProps) {
  const t = useLoop(playing, 8000, false);
  const petals = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.get() * 360}deg` }] }));
  return (
    <ArtBox>
      <Layer style={[styles.centerPivot, petals]}>
        <Flower petal="#f48fb1" />
      </Layer>
      <Layer>
        <Circle cx={28} cy={28} r={6} fill={ink.sun} />
      </Layer>
    </ArtBox>
  );
}

/** Foliage: a big plane-tree (πλάτανος) leaf swaying on its stalk */
function PlaneLeaf({ playing }: ArtProps) {
  const t = useLoop(playing, 2000);
  const leaf = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [-7, 7])}deg` }] }));
  return (
    <ArtBox>
      <Layer style={[styles.groundPivot, leaf]}>
        <Line x1={28} y1={40} x2={28} y2={54} stroke={ink.leafDark} strokeWidth={2.4} strokeLinecap="round" />
        <Path
          d="M28 40 L20 43 L9 41 L14 35 L3 28 L13 25 L9 14 L19 19 L21 8 L28 3 L35 8 L37 19 L47 14 L43 25 L53 28 L42 35 L47 41 L36 43 Z"
          fill={ink.leaf}
          stroke={ink.leafDark}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
        <Path
          d="M28 40 L28 7 M28 40 L6 28 M28 40 L50 28 M28 40 L12 16 M28 40 L44 16"
          stroke={ink.leafDark}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Layer>
    </ArtBox>
  );
}

/** Bush: a round bush rustling */
function Bush({ playing }: ArtProps) {
  const t = useLoop(playing, 900);
  const bush = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(t.get(), [0, 1], [0.97, 1.04]) }, { rotate: `${interpolate(t.get(), [0, 1], [-2, 2])}deg` }],
  }));
  return (
    <ArtBox>
      <Layer>
        <Line x1={28} y1={54} x2={28} y2={44} stroke={ink.wood} strokeWidth={3} strokeLinecap="round" />
      </Layer>
      <Layer style={[styles.bushPivot, bush]}>
        <Circle cx={18} cy={36} r={11} fill={ink.leaf} />
        <Circle cx={38} cy={36} r={11} fill={ink.leaf} />
        <Circle cx={28} cy={25} r={13} fill="#82bf5a" />
        <Circle cx={24} cy={22} r={2} fill={ink.leafDark} />
        <Circle cx={34} cy={30} r={2} fill={ink.leafDark} />
        <Circle cx={17} cy={37} r={2} fill={ink.leafDark} />
      </Layer>
    </ArtBox>
  );
}

export function KindArt({ kind, playing }: ArtProps & { kind: PlantKind }) {
  if (kind === 'flowers') return <TurningFlower playing={playing} />;
  if (kind === 'leaves') return <PlaneLeaf playing={playing} />;
  return <Bush playing={playing} />;
}

/* ─────────────── Size ─────────────── */

const SIZE_HEIGHT: Record<PlantSize, number> = { small: 10, medium: 20, large: 32 };

/** Size: a plant in a pot, short / medium / tall, growing a little */
export function SizeArt({ size, playing }: ArtProps & { size: PlantSize }) {
  const t = useLoop(playing, 1600);
  const plant = useAnimatedStyle(() => ({ transform: [{ scaleY: interpolate(t.get(), [0, 1], [0.88, 1]) }] }));
  const top = 39 - SIZE_HEIGHT[size];
  return (
    <ArtBox>
      <Layer style={[styles.potPivot, plant]}>
        <Line x1={28} y1={40} x2={28} y2={top} stroke={ink.stem} strokeWidth={2.2} strokeLinecap="round" />
        <Path d={`M28 ${top + 2} Q20 ${top} 18 ${top - 6} Q26 ${top - 5} 28 ${top + 2} Z`} fill={ink.leaf} />
        <Path d={`M28 ${top + 2} Q36 ${top} 38 ${top - 6} Q30 ${top - 5} 28 ${top + 2} Z`} fill={ink.leaf} />
        {size !== 'small' && <Path d="M28 34 Q20 32 19 27 Q26 28 28 34 Z" fill={ink.leaf} />}
        {size === 'large' && <Path d="M28 26 Q36 24 37 19 Q30 20 28 26 Z" fill={ink.leaf} />}
      </Layer>
      <Layer>
        <Pot />
      </Layer>
    </ArtBox>
  );
}

/* ─────────────── Difficulty ─────────────── */

/** Easy: a watering can tilting and pouring */
function WateringCan({ playing }: ArtProps) {
  const t = useLoop(playing, 1400);
  const can = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [0, -22])}deg` }] }));
  const drops = useAnimatedStyle(() => ({ opacity: playing ? interpolate(t.get(), [0, 0.6, 1], [0, 0, 1]) : 0 }));
  return (
    <ArtBox>
      <Layer style={[styles.canPivot, can]}>
        <Path d="M16 24 L36 24 L34 44 L18 44 Z" fill={ink.sky} />
        <Path d="M36 28 L50 18 L52 21 L37 33 Z" fill={ink.sky} />
        <Path d="M16 28 Q8 30 12 38 Q14 41 17 40" stroke={ink.sky} strokeWidth={2.4} fill="none" />
      </Layer>
      <Layer style={drops}>
        <Circle cx={8} cy={24} r={1.8} fill={ink.sky} />
        <Circle cx={6} cy={31} r={1.8} fill={ink.sky} />
        <Circle cx={11} cy={34} r={1.8} fill={ink.sky} />
      </Layer>
    </ArtBox>
  );
}

/** Medium: two drops falling one after the other */
function TwoDrops({ playing }: ArtProps) {
  const t = useLoop(playing, 1600, false);
  const first = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(t.get(), [0, 0.1, 0.5, 0.6], [0, 1, 1, 0], 'clamp') : 1,
    transform: [{ translateY: interpolate(t.get(), [0, 0.6], [-10, 10], 'clamp') }],
  }));
  const second = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(t.get(), [0.4, 0.5, 0.9, 1], [0, 1, 1, 0], 'clamp') : 1,
    transform: [{ translateY: interpolate(t.get(), [0.4, 1], [-10, 10], 'clamp') }],
  }));
  const drop = (x: number) => `M${x} 18 Q${x + 7} 28 ${x + 7} 32 A7 7 0 0 1 ${x - 7} 32 Q${x - 7} 28 ${x} 18 Z`;
  return (
    <ArtBox>
      <Layer style={first}>
        <Path d={drop(19)} fill={ink.sky} />
      </Layer>
      <Layer style={second}>
        <Path d={drop(37)} fill={ink.sky} />
      </Layer>
    </ArtBox>
  );
}

/** Hard: a gauge whose needle trembles near the top */
function Gauge({ playing }: ArtProps) {
  const t = useLoop(playing, 260);
  const needle = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(t.get(), [0, 1], [56, 64])}deg` }] }));
  return (
    <ArtBox>
      <Layer>
        <Path d="M8 40 A20 20 0 0 1 22 21" stroke={ink.leaf} strokeWidth={5} fill="none" />
        <Path d="M23 20.5 A20 20 0 0 1 36 21.5" stroke={ink.sun} strokeWidth={5} fill="none" />
        <Path d="M37 22 A20 20 0 0 1 48 40" stroke={ink.tomato} strokeWidth={5} fill="none" />
      </Layer>
      <Layer style={[styles.gaugePivot, needle]}>
        <Line x1={28} y1={40} x2={28} y2={22} stroke={ink.steel} strokeWidth={2.6} strokeLinecap="round" />
      </Layer>
      <Layer>
        <Circle cx={28} cy={40} r={3.4} fill={ink.steel} />
      </Layer>
    </ArtBox>
  );
}

export function DifficultyArt({ difficulty, playing }: ArtProps & { difficulty: 1 | 2 | 3 }) {
  if (difficulty === 1) return <WateringCan playing={playing} />;
  if (difficulty === 2) return <TwoDrops playing={playing} />;
  return <Gauge playing={playing} />;
}

const styles = StyleSheet.create({
  nodePivot: { transformOrigin: pivot(28, 10) },
  potPivot: { transformOrigin: pivot(28, 40) },
  groundPivot: { transformOrigin: pivot(28, 54) },
  centerPivot: { transformOrigin: pivot(28, 28) },
  bushPivot: { transformOrigin: pivot(28, 46) },
  canPivot: { transformOrigin: pivot(26, 44) },
  gaugePivot: { transformOrigin: pivot(28, 40) },
});
