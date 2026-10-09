import type { SunPart } from '@growme/shared';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

const COLORS: Record<SunPart, string> = { morning: '#ffc93c', noon: '#ffb000', afternoon: '#f5862e' };

/**
 * The sun for the part of the day a plant wants it: rising over the horizon (morning), high with all
 * its rays (noon), setting (afternoon)
 */
export function SunIcon({ part, size = 32 }: { part: SunPart; size?: number }) {
  const color = COLORS[part];
  return (
    // Decoration only: hidden from screen readers (on the View, which handles it on web too)
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {part === 'noon' ? (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <G key={i} transform={`rotate(${i * 45} 16 16)`}>
                <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
              </G>
            ))}
            <Circle cx={16} cy={16} r={7} fill={color} />
          </>
        ) : (
          <>
            {[-60, -30, 0, 30, 60].map((angle) => (
              <G key={angle} transform={`rotate(${angle} 16 21)`}>
                <Line x1={16} y1={7} x2={16} y2={10} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
              </G>
            ))}
            <Path d="M8 21 A8 8 0 0 1 24 21 Z" fill={color} />
            <Line x1={3} y1={21.5} x2={29} y2={21.5} stroke="#8a96a3" strokeWidth={2} strokeLinecap="round" />
            {/* Up for the morning, down for the afternoon */}
            <Path
              d={part === 'morning' ? 'M16 30 L16 25 M13.5 27.5 L16 25 L18.5 27.5' : 'M16 25 L16 30 M13.5 27.5 L16 30 L18.5 27.5'}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
}
