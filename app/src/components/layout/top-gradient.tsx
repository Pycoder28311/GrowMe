import { useId } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTopClearance } from '@/components/layout/app-shell';
import { colors } from '@/theme';

/** How far below the corner buttons the glow has faded out */
const EXTRA = 110;
/** Eased fade (smoothstep), so the gradient has no visible end */
const STOPS = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return 1 - t * t * (3 - 2 * t);
});

/** A soft glow of the botanical page colour at the top of a page, behind the corner buttons, so the page fades under them (drawn over the page, not touchable) */
export function TopGradient() {
  const id = `top-gradient-${useId().replace(/:/g, '')}`;
  const width = useWindowDimensions().width;
  const height = useTopClearance() + EXTRA;
  return (
    <Svg pointerEvents="none" width={width} height={height} style={styles.gradient}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {STOPS.map((opacity, i) => (
            <Stop key={i} offset={i / (STOPS.length - 1)} stopColor={colors.page} stopOpacity={opacity * 0.9} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
