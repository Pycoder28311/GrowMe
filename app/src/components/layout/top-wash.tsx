import { warm } from '@/config/botanical-theme';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { PaperGrain } from '@/components/ui/flower-shapes';
import { tileGrain } from '@/theme';

import { CORAL, CORAL_RIB, OLIVE, OLIVE_RIB, leaf, petal, rib, type Point } from '@/components/wiki/corner-flowers';

// The mockup's wash at the top right: a flat peach watercolour cloud with a visible edge (not a soft glow), its
// left border dipping down round the corner flower, and a deeper-toned patch beside the right edge. Drawn in the
// mockup's own screenshot pixels (841 wide) and scaled to the window.
const SHOT = { w: 841, h: 340 } as const;

const WASH = warm('#f4c49c');
const WASH_RIM = warm('#e9a97c');
const WASH_DEEP = warm('#eeb584');

const CLOUD =
  'M470 0 C463 30 476 64 500 84 C524 104 548 98 572 118 C592 138 602 166 630 172 C662 178 692 168 722 174 C746 180 752 214 760 250 C768 286 792 306 841 320 L841 0 Z';
const PATCH = 'M744 178 C752 176 760 192 764 226 C770 268 796 296 841 312 L841 190 C810 176 774 168 744 178 Z';

type Part = { from: Point; to: Point; width: number };

// The painted petals and leaves of the mockup's header, in the same screenshot pixels
const FAN_ROOT: Point = [653, 165];
const FAN: Part[] = [
  { from: FAN_ROOT, to: [563, 37], width: 29 },
  { from: FAN_ROOT, to: [673, 63], width: 21 },
  { from: FAN_ROOT, to: [502, 147], width: 30 },
  { from: FAN_ROOT, to: [638, 192], width: 11 },
];
const SPRIG_LEAVES: Part[] = [
  { from: [760, 227], to: [683, 163], width: 25 },
  { from: [787, 112], to: [825, 35], width: 22 },
  { from: [798, 207], to: [846, 84], width: 30 },
  { from: [802, 217], to: [846, 172], width: 15 },
];
// At the left edge: two coral petals and an olive leaf, mostly past the screen
const EDGE_PETALS: Part[] = [
  { from: [-6, 152], to: [22, 76], width: 15 },
  { from: [-6, 152], to: [34, 118], width: 13 },
];
const EDGE_LEAVES: Part[] = [{ from: [-6, 200], to: [54, 172], width: 12 }];

/** Fixed behind the page's content, over the top glow (not touchable) */
export function TopWash() {
  const width = useWindowDimensions().width;
  const height = (width * SHOT.h) / SHOT.w;
  return (
    <View pointerEvents="none" style={[styles.wash, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${SHOT.w} ${SHOT.h}`}>
        <Defs>
          <LinearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={WASH} stopOpacity={0.85} />
            <Stop offset="1" stopColor={WASH_DEEP} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="petal" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={CORAL} stopOpacity={0.8} />
            <Stop offset="1" stopColor={CORAL} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={OLIVE} stopOpacity={0.8} />
            <Stop offset="1" stopColor={OLIVE} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path d={CLOUD} fill="url(#wash)" />
        {/* The paint pooling a little darker along its edge */}
        <Path d={CLOUD} fill="none" stroke={WASH_RIM} strokeWidth={6} opacity={0.3} />
        <Path d={PATCH} fill={WASH_DEEP} opacity={0.7} />
        <Path d="M792 238 C800 215 790 190 783 172" stroke={OLIVE} strokeWidth={4} fill="none" strokeLinecap="round" />
        {[...SPRIG_LEAVES, ...EDGE_LEAVES].map((part, i) => (
          <Path key={`leaf-${i}`} d={leaf(part.from, part.to, part.width)} fill="url(#leaf)" />
        ))}
        {[...SPRIG_LEAVES, ...EDGE_LEAVES].map((part, i) => (
          <Path
            key={`vein-${i}`}
            d={rib(part.from, part.to)}
            stroke={OLIVE_RIB}
            strokeWidth={1.2}
            opacity={0.3}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {[...FAN, ...EDGE_PETALS].map((part, i) => (
          <Path key={`petal-${i}`} d={petal(part.from, part.to, part.width)} fill="url(#petal)" />
        ))}
        {[...FAN, ...EDGE_PETALS].map((part, i) => (
          <Path
            key={`rib-${i}`}
            d={rib(part.from, part.to)}
            stroke={CORAL_RIB}
            strokeWidth={1.4}
            opacity={0.25}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      <PaperGrain opacity={tileGrain} />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
