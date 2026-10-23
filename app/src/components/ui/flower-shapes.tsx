import { useId, type ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { darker, lighter } from '@/theme';

// Painted-looking botanical shapes for backgrounds (the plant page's tiles, header and title): a five-petal
// flower, a petal, a round geranium leaf, a long leaf and an organic blob. Each surface is shaded with
// gradients (a lit side and a shadowed side), with veins, a soft highlight and a darker rim, so it reads like
// the mockup's cut-paper / painted surfaces rather than a flat fill. Decoration only: hidden from screen
// readers. Drawn on a 100×100 grid, scaled to `size`; place them with `style` (usually absolute, partly outside
// their box, which clips them).

type ShapeProps = { size: number; color: string; style?: StyleProp<ViewStyle>; rotate?: number; opacity?: number };

/** Gradient ids unique to one drawing (several of the same shape share a page) */
const useIds = () => {
  const base = useId().replace(/:/g, '');
  return (name: string) => `${name}-${base}`;
};

function Shape({ size, style, rotate = 0, opacity = 1, children }: Omit<ShapeProps, 'color'> & { children: ReactNode }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[{ position: 'absolute', width: size, height: size, opacity, transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {children}
      </Svg>
    </View>
  );
}

/** A light-from-the-top-left fill: lighter at the lit side, the colour in the middle, darker at the far edge */
function LitFill({ id, color, cx = '35%', cy = '30%' }: { id: string; color: string; cx?: string; cy?: string }) {
  return (
    <RadialGradient id={id} cx={cx} cy={cy} r="75%" fx={cx} fy={cy}>
      <Stop offset="0" stopColor={lighter(color, 0.28)} />
      <Stop offset="0.55" stopColor={color} />
      <Stop offset="1" stopColor={darker(color, 0.22)} />
    </RadialGradient>
  );
}

/* ─────────────── Flower ─────────────── */

/** One petal of the flower, pointing up from the centre */
const FLOWER_PETAL = 'M50 50 C33 41 26 15 44 5 C48 3 52 3 56 5 C74 15 67 41 50 50 Z';

/** A five-petal flower: each petal shaded from a deep base to a lighter, ruffled tip, with fine veins; stamens in the middle */
export function FlowerShape({ color, center, ...props }: ShapeProps & { center?: string }) {
  const id = useIds();
  const heart = center ?? darker(color, 0.25);
  return (
    <Shape {...props}>
      <Defs>
        <LinearGradient id={id('petal')} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={darker(color, 0.3)} />
          <Stop offset="0.45" stopColor={color} />
          <Stop offset="1" stopColor={lighter(color, 0.22)} />
        </LinearGradient>
      </Defs>
      {[0, 72, 144, 216, 288].map((angle) => (
        <G key={angle} transform={`rotate(${angle} 50 50)`}>
          <Path d={FLOWER_PETAL} fill={`url(#${id('petal')})`} stroke={darker(color, 0.18)} strokeWidth={0.6} />
          {/* Veins fanning from the base */}
          <Path d="M50 47 L50 12 M50 45 L42 16 M50 45 L58 16" stroke={darker(color, 0.25)} strokeWidth={0.7} opacity={0.45} strokeLinecap="round" />
          {/* A soft light on one side of the petal */}
          <Ellipse cx={45} cy={22} rx={4} ry={9} fill="#ffffff" opacity={0.16} />
        </G>
      ))}
      <Circle cx={50} cy={50} r={9} fill={heart} />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <G key={angle} transform={`rotate(${angle} 50 50)`}>
          <Path d="M50 50 L50 41" stroke={lighter(heart, 0.35)} strokeWidth={0.9} />
          <Circle cx={50} cy={40} r={1.5} fill={lighter(heart, 0.55)} />
        </G>
      ))}
    </Shape>
  );
}

/* ─────────────── Petal ─────────────── */

/** One big petal, like the mockup's coral petals at a tile's edge: a deep base, a lighter edge, fine veins and a sheen */
export function PetalShape({ color, ...props }: ShapeProps) {
  const id = useIds();
  return (
    <Shape {...props}>
      <Defs>
        <LinearGradient id={id('fill')} x1="0.5" y1="1" x2="0.5" y2="0">
          <Stop offset="0" stopColor={darker(color, 0.28)} />
          <Stop offset="0.5" stopColor={color} />
          <Stop offset="1" stopColor={lighter(color, 0.2)} />
        </LinearGradient>
      </Defs>
      <Path d="M50 97 C17 79 7 41 29 13 C39 1 61 1 71 13 C93 41 83 79 50 97 Z" fill={`url(#${id('fill')})`} stroke={darker(color, 0.2)} strokeWidth={0.8} />
      {[-18, -9, 0, 9, 18].map((dx) => (
        <Path key={dx} d={`M50 94 Q${50 + dx * 0.6} 55 ${50 + dx} 12`} stroke={darker(color, 0.22)} strokeWidth={0.8} opacity={0.4} fill="none" />
      ))}
      <Path d="M36 22 Q30 44 38 66" stroke="#ffffff" strokeWidth={5} opacity={0.14} fill="none" strokeLinecap="round" />
    </Shape>
  );
}

/* ─────────────── Leaves ─────────────── */

/** The round, scalloped outline of a geranium leaf, with the notch where the stalk joins */
const ROUND_LEAF = (() => {
  const lobes = 9;
  const points: string[] = [];
  for (let i = 0; i <= lobes; i++) {
    // From just right of the notch round to just left of it
    const angle = (Math.PI / 2 + 0.16 + (i / lobes) * (2 * Math.PI - 0.32)) % (2 * Math.PI);
    const x = 50 + Math.cos(angle) * 44;
    const y = 52 + Math.sin(angle) * 44;
    if (i === 0) points.push(`M50 80 L${x.toFixed(1)} ${y.toFixed(1)}`);
    else {
      const mid = angle - (Math.PI - 0.16 / lobes) / lobes;
      const cx = 50 + Math.cos(mid) * 52;
      const cy = 52 + Math.sin(mid) * 52;
      points.push(`Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  return `${points.join(' ')} Z`;
})();

/** A round geranium leaf: shaded green, its darker horseshoe zone, veins from the stalk and a soft sheen */
export function LeafShape({ color, ...props }: ShapeProps) {
  const id = useIds();
  return (
    <Shape {...props}>
      <Defs>
        <LitFill id={id('fill')} color={color} />
      </Defs>
      <Path d={ROUND_LEAF} fill={`url(#${id('fill')})`} stroke={darker(color, 0.28)} strokeWidth={0.9} />
      {/* The zonal geranium's darker band */}
      <Circle cx={50} cy={52} r={24} stroke={darker(color, 0.3)} strokeWidth={7} fill="none" opacity={0.28} />
      {Array.from({ length: 9 }, (_, i) => {
        // From the stalk (bottom) out to the edge, fanning over the leaf
        const angle = Math.PI / 2 + 0.5 + (i / 8) * (2 * Math.PI - 1);
        const x = 50 + Math.cos(angle) * 40;
        const y = 52 + Math.sin(angle) * 40;
        return <Path key={i} d={`M50 74 Q${(50 + x) / 2} ${(74 + y) / 2 - 3} ${x.toFixed(1)} ${y.toFixed(1)}`} stroke={lighter(color, 0.3)} strokeWidth={1} opacity={0.55} fill="none" strokeLinecap="round" />;
      })}
      <Ellipse cx={36} cy={32} rx={12} ry={7} fill="#ffffff" opacity={0.12} transform="rotate(-30 36 32)" />
    </Shape>
  );
}

/** A long leaf: shaded from its lit edge to its shadowed one, a pale midrib and side veins */
export function LongLeafShape({ color, ...props }: ShapeProps) {
  const id = useIds();
  return (
    <Shape {...props}>
      <Defs>
        <LinearGradient id={id('fill')} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={lighter(color, 0.22)} />
          <Stop offset="0.5" stopColor={color} />
          <Stop offset="1" stopColor={darker(color, 0.25)} />
        </LinearGradient>
      </Defs>
      <Path d="M50 98 C20 76 12 34 50 2 C88 34 80 76 50 98 Z" fill={`url(#${id('fill')})`} stroke={darker(color, 0.25)} strokeWidth={0.8} />
      <Path d="M50 94 Q48 50 50 10" stroke={lighter(color, 0.35)} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {[26, 40, 54, 68, 80].map((y) => (
        <Path key={y} d={`M50 ${y + 10} Q42 ${y + 4} ${34 - (y - 50) * 0.08} ${y} M50 ${y + 10} Q58 ${y + 4} ${66 + (y - 50) * 0.08} ${y}`} stroke={lighter(color, 0.25)} strokeWidth={0.9} opacity={0.6} fill="none" strokeLinecap="round" />
      ))}
    </Shape>
  );
}

/**
 * The long leaf drawn as lines only: its outline, midrib and side veins. With `glow`, instead of an empty inside
 * it has a soft inner shadow in that colour, strongest at the outline and fading in towards the middle over
 * `glowSpread` of the way (0–1).
 */
export function LongLeafOutlineShape({ color, glow, glowSpread = 0.45, ...props }: ShapeProps & { glow?: string; glowSpread?: number }) {
  const id = useIds();
  return (
    <Shape {...props}>
      {glow && (
        <Defs>
          <RadialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
            <Stop offset={1 - glowSpread} stopColor={glow} stopOpacity={0} />
            <Stop offset="1" stopColor={glow} stopOpacity={0.55} />
          </RadialGradient>
        </Defs>
      )}
      <Path
        d="M50 98 C20 76 12 34 50 2 C88 34 80 76 50 98 Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={glow ? `url(#${id('glow')})` : 'none'}
      />
      <Path d="M50 94 Q48 50 50 10" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {[26, 40, 54, 68, 80].map((y) => (
        <Path key={y} d={`M50 ${y + 10} Q42 ${y + 4} ${34 - (y - 50) * 0.08} ${y} M50 ${y + 10} Q58 ${y + 4} ${66 + (y - 50) * 0.08} ${y}`} stroke={color} strokeWidth={1} fill="none" strokeLinecap="round" />
      ))}
    </Shape>
  );
}

/* ─────────────── Blob ─────────────── */

/** A round, uneven blob (the organic shapes at the mockup's edges): softly lit, with a darker rim */
export function BlobShape({ color, ...props }: ShapeProps) {
  const id = useIds();
  return (
    <Shape {...props}>
      <Defs>
        <LitFill id={id('fill')} color={color} />
      </Defs>
      <Path
        d="M54 4 C80 6 98 28 96 54 C94 82 70 98 44 96 C18 94 2 72 4 46 C6 20 28 2 54 4 Z"
        fill={`url(#${id('fill')})`}
        stroke={darker(color, 0.18)}
        strokeWidth={1.2}
      />
      <Path d="M22 34 C28 20 42 13 56 13" stroke="#ffffff" strokeWidth={4} opacity={0.12} fill="none" strokeLinecap="round" />
    </Shape>
  );
}

/* ─────────────── Surfaces ─────────────── */

/**
 * A fine paper grain over a coloured surface (a tile, a card, the page), so its flat colour and its shapes
 * look printed on paper like the mockup's. A small transparent PNG, tiled; put it after the background and
 * before the content.
 */
export function PaperGrain({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        source={require('@/assets/images/textures/paper-grain.png')}
        resizeMode="repeat"
        accessible={false}
        style={styles.grain}
      />
    </View>
  );
}

/**
 * The curved line where a photo meets the page below it: the page's colour rising in a soft wave over the
 * photo's bottom (low at the left, up in the middle, down again, rising at the right), instead of a fade.
 */
export function CurvedEdge({ width, height, color }: { width: number; height: number; color: string }) {
  const h = height;
  const d = `M0 ${h * 0.62} C${width * 0.2} ${h * 0.08} ${width * 0.46} ${h * 0.02} ${width * 0.62} ${h * 0.38} S${width * 0.86} ${h * 0.9} ${width} ${h * 0.28} L${width} ${h} L0 ${h} Z`;
  return (
    <Svg pointerEvents="none" width={width} height={h} style={{ position: 'absolute', left: 0, bottom: -1 }}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

/* ─────────────── On the tiles ─────────────── */

// The tile flowers are kept minimal: flat petals in one colour (a second row a shade darker behind), and a plain
// centre a shade deeper than the petals, with no veins, stamens or seeds

/** A round flower: five broad petals over five smaller darker ones between them, a plain centre */
function RoundFlowerShape({ color, ...props }: ShapeProps) {
  return (
    <Shape {...props}>
      {[36, 108, 180, 252, 324].map((angle) => (
        <Path key={angle} d="M50 50 C36 44 35 18 50 16 C65 18 64 44 50 50 Z" fill={darker(color, 0.1)} transform={`rotate(${angle} 50 50)`} />
      ))}
      {[0, 72, 144, 216, 288].map((angle) => (
        <Path key={angle} d="M50 50 C30 40 28 6 50 4 C72 6 70 40 50 50 Z" fill={color} transform={`rotate(${angle} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={8} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/** A daisy: ten narrow petals over a darker second row, a plain round centre */
function DaisyShape({ color, ...props }: ShapeProps) {
  const step = 36;
  return (
    <Shape {...props}>
      {Array.from({ length: 10 }, (_, i) => (
        <Ellipse key={i} cx={50} cy={24} rx={6} ry={21} fill={darker(color, 0.1)} transform={`rotate(${i * step + step / 2} 50 50)`} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <Ellipse key={i} cx={50} cy={22} rx={6} ry={22} fill={color} transform={`rotate(${i * step} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={12} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/** A cosmos: five wide petals with notched tips, a plain centre */
const COSMOS_PETAL = 'M50 50 C33 42 24 14 35 4 L43 9 L50 2 L57 9 L65 4 C76 14 67 42 50 50 Z';

function CosmosShape({ color, ...props }: ShapeProps) {
  return (
    <Shape {...props}>
      {Array.from({ length: 5 }, (_, i) => (
        <Path key={i} d={COSMOS_PETAL} fill={color} transform={`rotate(${i * 72 + 36} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={8} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/** A geranium bloom: five broad overlapping petals (the two upper ones larger) in two shades, a plain centre */
function GeraniumShape({ color, ...props }: ShapeProps) {
  // Each petal: its turn, how long and wide it is, and whether it is the darker, back one
  const petals = [
    { turn: 105, rx: 22, ry: 27, back: true },
    { turn: 175, rx: 21, ry: 25, back: true },
    { turn: 245, rx: 22, ry: 27, back: true },
    { turn: -35, rx: 25, ry: 33, back: false },
    { turn: 38, rx: 26, ry: 34, back: false },
  ];
  return (
    <Shape {...props}>
      {/* Drawn a little inside the frame so no petal is cut by it */}
      <G transform="translate(50 50) scale(0.72) translate(-50 -50)">
        {petals.map(({ turn, rx, ry, back }) => (
          <Ellipse key={turn} cx={50} cy={50 - ry * 0.85} rx={rx} ry={ry} fill={back ? darker(color, 0.1) : color} transform={`rotate(${turn} 50 50)`} />
        ))}
      </G>
      <Circle cx={50} cy={50} r={4} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/** A blossom: six round petals round a plain centre */
function BlossomShape({ color, ...props }: ShapeProps) {
  return (
    <Shape {...props}>
      {Array.from({ length: 6 }, (_, i) => (
        <Circle key={i} cx={50} cy={25} r={18} fill={color} transform={`rotate(${i * 60 + 20} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={10} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/** A four petal flower: broad petals in a cross over a darker turned second cross, a plain centre */
function CrossShape({ color, ...props }: ShapeProps) {
  return (
    <Shape {...props}>
      {[45, 135, 225, 315].map((angle) => (
        <Ellipse key={angle} cx={50} cy={26} rx={13} ry={24} fill={darker(color, 0.1)} transform={`rotate(${angle} 50 50)`} />
      ))}
      {[0, 90, 180, 270].map((angle) => (
        <Ellipse key={angle} cx={50} cy={24} rx={16} ry={26} fill={color} transform={`rotate(${angle} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={8} fill={darker(color, 0.25)} />
    </Shape>
  );
}

/**
 * Each tile shape: its drawing, size and place as shares of the tile's
 * height, and its turn. Flowers, each with its centre in the tile's bottom right corner so about a quarter
 * of it shows.
 */
const TILE_SHAPE_LOOKS = {
  daisy: { Drawing: DaisyShape, size: 0.986, right: -0.429, top: 0.429, rotate: 0 },
  flower: { Drawing: RoundFlowerShape, size: 1.1, right: -0.479, top: 0.379, rotate: 0 },
  cosmos: { Drawing: CosmosShape, size: 1.036, right: -0.45, top: 0.414, rotate: 10 },
  blossom: { Drawing: BlossomShape, size: 1.0, right: -0.45, top: 0.4, rotate: 20 },
  cross: { Drawing: CrossShape, size: 1.0, right: -0.45, top: 0.4, rotate: 0 },
  geranium: { Drawing: GeraniumShape, size: 1.15, right: -0.45, top: 0.4, rotate: 0 },
} as const;

/** How much bigger the flowers are drawn than the shares above say (they grow round their centres) */
const TILE_SHAPE_GROWTH = 1.3;

export type TileShapeKind = keyof typeof TILE_SHAPE_LOOKS;

/** The shape of each square in turn, down the page: all different, so no two squares carry the same flower */
export const TILE_SHAPES: readonly TileShapeKind[] = ['daisy', 'flower', 'cosmos', 'blossom', 'cross', 'geranium'];

/** A tile's decoration: one of the shapes above at its right edge, partly outside it (the tile clips it) */
export function TileShape({ kind, color, height, opacity = 1 }: { kind: TileShapeKind; color: string; height: number; opacity?: number }) {
  const { Drawing, size, right, top, rotate } = TILE_SHAPE_LOOKS[kind];
  // Bigger, round the same centre
  const grown = size * TILE_SHAPE_GROWTH;
  const place = (offset: number) => offset + size / 2 - grown / 2;
  return <Drawing size={height * grown} color={color} opacity={opacity} rotate={rotate} style={{ right: height * place(right), top: height * place(top) }} />;
}

const styles = StyleSheet.create({
  grain: {
    width: '100%',
    height: '100%',
  },
});

/** One of the square flowers on its own (a background's flower): drawn in the frame it is given, round its centre */
export function FlatFlower({ kind, ...props }: ShapeProps & { kind: TileShapeKind }) {
  const { Drawing } = TILE_SHAPE_LOOKS[kind];
  return <Drawing {...props} />;
}
