import { View } from 'react-native';
import Svg, { G, Line, Polygon } from 'react-native-svg';

import { colors, iconSize } from '@/theme';

/** How far the plane is moved inside its 24×24 box (see below) */
const NUDGE = { x: -0.5, y: 2.3 };

/**
 * The "send a message" paper plane, drawn as an outline (like a direct-message button): the plane
 * tilted up to the right, with the fold from its tip to the middle. Same look on every platform.
 */
export function SendIcon({ size = iconSize.big, color = colors.ink }: { size?: number; color?: string }) {
  return (
    // Decoration only: the button carries the label
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Moved down and a little left: the wide top edge carries most of the plane's weight, so
            this puts it in the visual centre of a round button */}
        <G transform={`translate(${NUDGE.x} ${NUDGE.y})`}>
          <Polygon points="2,3 22,3 11.7,20.3 9.2,10.1" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Line x1={22} y1={3} x2={9.2} y2={10.1} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}
